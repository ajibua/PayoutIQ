import React, { useState, useEffect } from 'react';
import Header from './screens/Header';
import Footer from './screens/Footer';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import LandingScreen from './screens/LandingScreen';
import UploadScreen from './screens/UploadScreen';
import ReviewScreen from './screens/ReviewScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import OtpScreen from './screens/OtpScreen';
import StatusScreen from './screens/StatusScreen';
import HistoryScreen from './screens/HistoryScreen';

// Set up dynamic API target URL
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('LANDING'); 
  const [loadingApp, setLoadingApp] = useState(true);
  
  // Data sharing states
  const [extractedPayees, setExtractedPayees] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [activeBatchId, setActiveBatchId] = useState(null);

  // Persistence & HTML5 Routing: Sync initial path and check for token on mount
  useEffect(() => {
    // Intercept OAuth callback redirect token in URL hash fragment
    const hash = window.location.hash;
    let savedToken = localStorage.getItem('payoutiq_token');
    
    if (hash && hash.includes('token=')) {
      const parsedToken = hash.split('token=')[1];
      localStorage.setItem('payoutiq_token', parsedToken);
      savedToken = parsedToken;
      // Clean up URL fragment
      window.history.replaceState(null, null, window.location.pathname);
    }

    // Determine target screen based on URL pathname
    const pathname = window.location.pathname.toLowerCase();
    let targetScreen = 'LANDING';
    
    if (pathname === '/login') targetScreen = 'LOGIN';
    else if (pathname === '/signup') targetScreen = 'SIGNUP';
    else if (pathname === '/upload') targetScreen = 'UPLOAD';
    else if (pathname === '/review') targetScreen = 'REVIEW';
    else if (pathname === '/confirmation') targetScreen = 'CONFIRMATION';
    else if (pathname === '/otp') targetScreen = 'OTP';
    else if (pathname.startsWith('/status')) targetScreen = 'STATUS';
    else if (pathname === '/history') targetScreen = 'HISTORY';

    // Extract batch ID if on status page pathname (e.g. /status/uuid)
    if (pathname.startsWith('/status/')) {
      const parts = pathname.split('/');
      if (parts[2]) {
        setActiveBatchId(parts[2]);
      }
    }

    if (savedToken) {
      // Validate token or get user profile
      fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Token expired");
      })
      .then(userData => {
        setUser(userData);
        setToken(savedToken);
        // If logged in, go to their loaded path (or upload page if they loaded landing/login/signup)
        if (['LANDING', 'LOGIN', 'SIGNUP'].includes(targetScreen)) {
          setCurrentScreen('UPLOAD');
          window.history.replaceState(null, '', '/upload');
        } else {
          setCurrentScreen(targetScreen);
        }
      })
      .catch(() => {
        localStorage.removeItem('payoutiq_token');
        // Send to login if they were on a protected page
        if (!['LANDING', 'LOGIN', 'SIGNUP'].includes(targetScreen)) {
          setCurrentScreen('LOGIN');
          window.history.replaceState(null, '', '/login');
        } else {
          setCurrentScreen(targetScreen);
        }
      })
      .finally(() => {
        setLoadingApp(false);
      });
    } else {
      // If not logged in and trying to access a protected page, redirect to Login
      if (!['LANDING', 'LOGIN', 'SIGNUP'].includes(targetScreen)) {
        setCurrentScreen('LOGIN');
        window.history.replaceState(null, '', '/login');
      } else {
        setCurrentScreen(targetScreen);
      }
      setLoadingApp(false);
    }
  }, []);

  // Listen to browser Back/Forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname.toLowerCase();
      let targetScreen = 'LANDING';
      
      if (pathname === '/login') targetScreen = 'LOGIN';
      else if (pathname === '/signup') targetScreen = 'SIGNUP';
      else if (pathname === '/upload') targetScreen = 'UPLOAD';
      else if (pathname === '/review') targetScreen = 'REVIEW';
      else if (pathname === '/confirmation') targetScreen = 'CONFIRMATION';
      else if (pathname === '/otp') targetScreen = 'OTP';
      else if (pathname.startsWith('/status')) {
        targetScreen = 'STATUS';
        const parts = pathname.split('/');
        if (parts[2]) {
          setActiveBatchId(parts[2]);
        }
      }
      else if (pathname === '/history') targetScreen = 'HISTORY';
      
      // Enforce auth checks on popstate
      const isLoggedIn = !!localStorage.getItem('payoutiq_token');
      if (!isLoggedIn && !['LANDING', 'LOGIN', 'SIGNUP'].includes(targetScreen)) {
        setCurrentScreen('LOGIN');
        window.history.replaceState(null, '', '/login');
      } else {
        setCurrentScreen(targetScreen);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (payload) => {
    localStorage.setItem('payoutiq_token', payload.access_token);
    setUser(payload.user);
    setToken(payload.access_token);
    setCurrentScreen('UPLOAD');
    window.history.pushState(null, '', '/upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('payoutiq_token');
    setUser(null);
    setToken(null);
    setCurrentScreen('LANDING');
    window.history.pushState(null, '', '/');
  };

  const handleNavigate = (target) => {
    if (target.startsWith('STATUS:')) {
      const parts = target.split(':');
      setActiveBatchId(parts[1]);
      setCurrentScreen('STATUS');
      window.history.pushState(null, '', `/status/${parts[1]}`);
    } else {
      setCurrentScreen(target);
      const path = target === 'LANDING' ? '/' : `/${target.toLowerCase()}`;
      window.history.pushState(null, '', path);
    }
  };

  const handleExtractionComplete = (payeesList) => {
    setExtractedPayees(payeesList);
    setCurrentScreen('REVIEW');
    window.history.pushState(null, '', '/review');
  };

  const handleConfirmBatch = async (batchPayload) => {
    try {
      const response = await fetch(`${API_URL}/api/payouts/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(batchPayload)
      });
      const data = await response.json();
      
      if (response.ok) {
        setActiveBatch({
          batch_id: data.batch_id,
          reference: data.reference,
          title: batchPayload.title,
          total_amount: data.total_amount,
          total_count: batchPayload.payees.length
        });
        setCurrentScreen('CONFIRMATION');
        window.history.pushState(null, '', '/confirmation');
      } else {
        alert(data.detail || 'Failed to initialize payout batch.');
      }
    } catch (e) {
      alert('Connection error. Failed to save payout batch.');
    }
  };

  const handleConfirmComplete = (confirmRes) => {
    setActiveBatchId(confirmRes.batch_id);
    if (confirmRes.status === 'PENDING_OTP') {
      setCurrentScreen('OTP');
      window.history.pushState(null, '', '/otp');
    } else {
      setCurrentScreen('STATUS');
      window.history.pushState(null, '', `/status/${confirmRes.batch_id}`);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LANDING':
        return (
          <LandingScreen
            user={user}
            onNavigate={handleNavigate}
          />
        );
      case 'LOGIN':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToSignup={() => handleNavigate('SIGNUP')}
            API_URL={API_URL}
          />
        );
      case 'SIGNUP':
        return (
          <SignupScreen
            onSignupSuccess={handleLogin}
            onNavigateToLogin={() => handleNavigate('LOGIN')}
            API_URL={API_URL}
          />
        );
      case 'UPLOAD':
        return (
          <UploadScreen
            onExtractionComplete={handleExtractionComplete}
            onCancel={() => handleNavigate('LANDING')}
            API_URL={API_URL}
            token={token}
          />
        );
      case 'REVIEW':
        return (
          <ReviewScreen
            extractedPayees={extractedPayees}
            onConfirmBatch={handleConfirmBatch}
            onBack={() => handleNavigate('UPLOAD')}
            API_URL={API_URL}
            token={token}
          />
        );
      case 'CONFIRMATION':
        return (
          <ConfirmationScreen
            batchDetails={activeBatch}
            onConfirmComplete={handleConfirmComplete}
            onCancel={() => handleNavigate('REVIEW')}
            API_URL={API_URL}
            token={token}
          />
        );
      case 'OTP':
        return (
          <OtpScreen
            batchId={activeBatchId}
            onOtpVerified={() => handleNavigate(`STATUS:${activeBatchId}`)}
            onCancel={() => handleNavigate('CONFIRMATION')}
            API_URL={API_URL}
            token={token}
          />
        );
      case 'STATUS':
        return (
          <StatusScreen
            batchId={activeBatchId}
            onFinished={() => handleNavigate('UPLOAD')}
            API_URL={API_URL}
            token={token}
          />
        );
      case 'HISTORY':
        return (
          <HistoryScreen
            onNavigate={handleNavigate}
            API_URL={API_URL}
            token={token}
          />
        );
      default:
        return <LandingScreen user={user} onNavigate={handleNavigate} />;
    }
  };

  if (loadingApp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-app)', gap: '16px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
        <div style={{ fontFamily: 'var(--font-header)', fontWeight: '600', color: 'var(--text-muted)' }}>
          Authenticating PayoutIQ Workspace...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Glassmorphism Background Blobs */}
      <div style={{ position: 'fixed', width: '350px', height: '350px', borderRadius: '50%', backgroundColor: '#A78BFA', filter: 'blur(100px)', zIndex: -1, opacity: 0.12, top: '10%', left: '10%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', width: '450px', height: '450px', borderRadius: '50%', backgroundColor: '#60A5FA', filter: 'blur(120px)', zIndex: -1, opacity: 0.15, bottom: '15%', right: '5%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: '#2DD4BF', filter: 'blur(90px)', zIndex: -1, opacity: 0.08, bottom: '5%', left: '20%', pointerEvents: 'none' }}></div>

      <Header
        user={user}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main style={{ flex: '1 0 auto' }}>
        {renderScreen()}
      </main>
      <Footer />
    </div>
  );
}
