import React from 'react';

export default function LandingScreen({ user, onNavigate }) {
  const bankLogos = [
    { name: 'Guaranty Trust Bank', code: 'GTBank' },
    { name: 'Access Bank', code: 'Access' },
    { name: 'Zenith Bank', code: 'Zenith' },
    { name: 'United Bank for Africa', code: 'UBA' },
    { name: 'OPay Digital Services', code: 'OPay' },
    { name: 'Moniepoint MFB', code: 'Moniepoint' },
    { name: 'First Bank of Nigeria', code: 'FirstBank' },
    { name: 'Palmpay', code: 'Palmpay' },
    { name: 'FCMB', code: 'FCMB' },
    { name: 'Sterling Bank', code: 'Sterling' }
  ];

  // Duplicate for seamless marquee effect
  const marqueeItems = [...bankLogos, ...bankLogos];

  return (
    <div className="anim-fade" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Disburse Bulk Payments Instantly, <span>with Zero Errors</span>
          </h1>
          <p className="hero-subtext">
            PayoutIQ converts messy payment lists using AI, pre-verifies bank account owner names via Monnify, flags duplicate entries, and dispatches secure disbursements in seconds.
          </p>
          
          <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '14px 32px', fontSize: '15.5px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
              onClick={() => user ? onNavigate('UPLOAD') : onNavigate('LOGIN')}
            >
              {user ? 'Go to Payout Workspace' : 'Get Started Free'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            
            <a 
              href="#how-it-works" 
              className="btn btn-secondary"
              style={{ padding: '14px 32px', fontSize: '15.5px', borderRadius: '8px' }}
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Partners Marquee Ticker */}
      <div className="marquee-container">
        <div className="marquee-track">
          {marqueeItems.map((bank, index) => (
            <div className="marquee-item" key={`${bank.code}-${index}`}>
              {/* Custom Bank Icon Placeholder */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
              {bank.name}
            </div>
          ))}
        </div>
      </div>

      {/* Amara's Story Section */}
      <section style={{ padding: '60px 0', backgroundColor: '#ffffff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            {/* Left Column: The Story */}
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Relatable Business Operations
              </span>
              <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '32px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.25', marginBottom: '24px' }}>
                Meet Amara, a boutique owner in Lagos
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', color: 'var(--text-muted)' }}>
                <div style={{ paddingLeft: '16px', borderLeft: '3px solid #EF4444' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>The Headache (Before PayoutIQ):</strong>
                  Every Friday, Amara spent hours manually copy-pasting 30 different staff and vendor account numbers into her banking app. She worried about typos, name mismatches, and duplicated payments. One minor slip meant sending salaries to a stranger.
                </div>
                
                <div style={{ paddingLeft: '16px', borderLeft: '3px solid var(--success)' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>The Relief (With PayoutIQ):</strong>
                  Now, Amara simply pastes her messy WhatsApp logs or bullet lists into PayoutIQ. The system instantly structures the names, queries Monnify for verified registry owners, alerts her to duplicates, and allows secure disbursement in one click.
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ marginTop: '32px' }}
                onClick={() => user ? onNavigate('UPLOAD') : onNavigate('SIGNUP')}
              >
                Start Disbursing Like Amara
              </button>
            </div>

            {/* Right Column: Relief Illustration Image */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-lg)', 
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-app)',
                padding: '16px',
                display: 'inline-block',
                maxWidth: '100%'
              }}>
                <img 
                  src="/amara_business_owner.png" 
                  alt="Amara, Lagos business owner successfully organizing payouts" 
                  style={{ width: '100%', height: 'auto', maxHeight: '360px', objectFit: 'contain', borderRadius: '8px' }}
                  onError={(e) => {
                    // Fallback if image isn't loaded yet
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stepper Section */}
      <section id="how-it-works" style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '30px', fontWeight: '700' }}>
              Disburse in 3 Simple Steps
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15.5px', marginTop: '8px' }}>
              We keep the process straightforward, transparent, and completely under your control.
            </p>
          </div>

          <div className="stepper-container">
            <div className="step-card">
              <div className="step-num">1</div>
              <h4 className="step-title">Paste Messy List</h4>
              <p className="step-desc">
                Paste WhatsApp text logs, copy-pasted spreadsheet cells, or upload a CSV file. The Gemini AI reads and structures names, amounts, and accounts.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-num">2</div>
              <h4 className="step-title">Verify Bank Records</h4>
              <p className="step-desc">
                PayoutIQ queries Monnify Name Enquiry to fetch verified registry names. It highlights name mismatches, duplicate accounts, and invalid inputs automatically.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-num">3</div>
              <h4 className="step-title">Submit & Send</h4>
              <p className="step-desc">
                Double-check the totals, authorize using a secure one-time password (OTP), and dispatch. Track transaction success rates in real-time logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section style={{ padding: '80px 0', backgroundColor: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '30px', fontWeight: '700' }}>
              Engineered for Speed & Integrity
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15.5px', marginTop: '8px' }}>
              Every feature is built to give your business confidence and save you valuable operations hours.
            </p>
          </div>

          <div className="grid grid-2">
            {/* Feature 1 */}
            <div className="card flex gap-2" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
                  AI Structural Extraction
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Our Gemini LLM parses unstructured lists in real-time, pulling names, account numbers, and bank indicators out of messy inputs.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card flex gap-2" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--success)', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
                  Monnify Registry Checks
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Pre-verify account credentials directly with Monnify sandbox name lookup endpoints. Never send money to the wrong person again.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card flex gap-2" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--warning)', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
                  Duplicate & Risk Warnings
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Our rule checking engine automatically highlights duplicate account numbers, mismatched owner names, and invalid bank codes in the review grid.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card flex gap-2" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--danger)', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
                  Downloadable Audit Reports
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Export full payment logs containing transaction references, dates, and plain-language bank rejection reasons directly into Excel-friendly CSV logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--primary-light)', textCenter: 'center', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>
            Ready to secure your business disbursements?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            Eliminate operational errors, typos, and duplicate payouts today. Start using PayoutIQ for free.
          </p>
          <button 
            className="btn btn-primary"
            style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '8px' }}
            onClick={() => user ? onNavigate('UPLOAD') : onNavigate('SIGNUP')}
          >
            Create Your Free Account
          </button>
        </div>
      </section>
    </div>
  );
}
