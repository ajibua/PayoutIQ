import React, { useState } from 'react';

export default function Header({ user, currentScreen, onNavigate, onLogout, balance }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  // Authenticated menu items (No Dashboard anymore)
  const navItems = [
    { id: 'UPLOAD', label: 'New Payout' },
    { id: 'HISTORY', label: 'Audit Logs' }
  ];

  const handleNavClick = (screenId) => {
    onNavigate(screenId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container flex align-center justify-between" style={{ height: '100%' }}>
        {/* Logo takes you to Landing screen */}
        <div 
          className="logo" 
          style={{ cursor: 'pointer' }} 
          onClick={() => handleNavClick('LANDING')}
        >
          {/* Custom SVG Logo */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Payout<span>IQ</span></span>
        </div>

        {/* Authenticated Nav */}
        {user ? (
          <>
            {/* Desktop Navigation */}
            <nav className="flex align-center gap-2" style={{ display: 'none' }}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`btn ${currentScreen === item.id || (item.id === 'UPLOAD' && ['REVIEW', 'CONFIRMATION', 'OTP', 'STATUS'].includes(currentScreen)) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    padding: '8px 16px', 
                    minHeight: '38px',
                    backgroundColor: currentScreen === item.id || (item.id === 'UPLOAD' && ['REVIEW', 'CONFIRMATION', 'OTP', 'STATUS'].includes(currentScreen)) ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: currentScreen === item.id || (item.id === 'UPLOAD' && ['REVIEW', 'CONFIRMATION', 'OTP', 'STATUS'].includes(currentScreen)) ? '#ffffff' : 'var(--text-main)'
                  }}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex align-center gap-2 nav-actions" style={{ display: 'none' }}>
              {balance !== null && (
                <div style={{ marginRight: '12px', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: '700' }}>Wallet Balance</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(balance)}</span>
                </div>
              )}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Hi, {user.first_name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ minHeight: '36px', padding: '6px 12px' }}
                onClick={onLogout}
              >
                Logout
              </button>
            </div>

            {/* Mobile Hamburger toggle */}
            <div className="header-nav-toggle flex align-center">
              <div className="user-badge-mobile" style={{ marginRight: '12px', fontSize: '13.5px', fontWeight: '600' }}>
                Hi, {user.first_name}
              </div>
              <button 
                className="btn-icon" 
                style={{ border: '1px solid var(--border)' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Unauthenticated Nav (Guest) */
          <>
            <nav className="flex align-center gap-2" style={{ display: 'none' }}>
              <a href="#how-it-works" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', padding: '0 12px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                How It Works
              </a>
              <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', padding: '0 12px', marginRight: '12px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                Features
              </a>
              <button className="btn btn-outline" style={{ minHeight: '36px', padding: '6px 16px' }} onClick={() => handleNavClick('LOGIN')}>
                Sign In
              </button>
            </nav>

            {/* Mobile guest menu toggle */}
            <div className="header-nav-toggle flex align-center">
              <button 
                className="btn-icon" 
                style={{ border: '1px solid var(--border)' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle guest menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media(min-width: 769px) {
          nav.flex { display: flex !important; }
          .nav-actions { display: flex !important; }
          .header-nav-toggle { display: none !important; }
        }
      `}</style>

      {/* Mobile Drawer (Authenticated) */}
      {mobileMenuOpen && user && (
        <div 
          className="mobile-drawer anim-fade"
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border)',
            padding: '16px 24px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              className="btn btn-outline w-full"
              style={{
                justifyContent: 'flex-start',
                backgroundColor: currentScreen === item.id ? 'var(--primary-light)' : 'transparent',
                borderColor: currentScreen === item.id ? 'var(--primary)' : 'var(--border)',
                color: currentScreen === item.id ? 'var(--primary)' : 'var(--text-main)'
              }}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
          {balance !== null && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: '700' }}>Balance</span>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(balance)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', padding: '12px 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{user.first_name} {user.last_name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <button className="btn btn-danger" style={{ minHeight: '36px', padding: '6px 16px' }} onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer (Guest) */}
      {mobileMenuOpen && !user && (
        <div 
          className="mobile-drawer anim-fade"
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border)',
            padding: '16px 24px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <a 
            href="#how-it-works" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '600', padding: '10px 0', display: 'block' }}
          >
            How It Works
          </a>
          <a 
            href="#features" 
            onClick={() => setMobileMenuOpen(false)} 
            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '600', padding: '10px 0', display: 'block' }}
          >
            Features
          </a>
          <button 
            className="btn btn-primary w-full" 
            style={{ marginTop: '8px' }} 
            onClick={() => handleNavClick('LOGIN')}
          >
            Sign In
          </button>
        </div>
      )}
    </header>
  );
}
