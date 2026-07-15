import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import { GymProvider } from './context/GymContext';

const AUTH_TOKEN_KEY = 'gymfitness_token';
const AUTH_USER_KEY = 'gymfitness_user';

async function requestAuth(path, options = {}) {
  const response = await fetch(`/api/auth${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedProfileMemberId, setSelectedProfileMemberId] = useState(null);
  
  // Navigation redirection triggers
  const [openAddMemberOnLoad, setOpenAddMemberOnLoad] = useState(false);
  const [openRecordPaymentOnLoad, setOpenRecordPaymentOnLoad] = useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function verifyStoredSession() {
      if (!authToken) {
        setAuthChecked(true);
        return;
      }

      try {
        const { user } = await requestAuth('/me', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!isMounted) return;
        setCurrentUser(user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        setIsAuthenticated(true);
      } catch {
        if (!isMounted) return;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem('gymfitness_auth');
        setAuthToken('');
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    }

    verifyStoredSession();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            setActivePage={setActivePage}
            setOpenAddMemberOnLoad={setOpenAddMemberOnLoad}
            setOpenRecordPaymentOnLoad={setOpenRecordPaymentOnLoad}
          />
        );
      case 'members':
        return (
          <MembersPage
            setActivePage={setActivePage}
            setSelectedProfileMemberId={setSelectedProfileMemberId}
            openAddModalOnLoad={openAddMemberOnLoad}
            setOpenAddModalOnLoad={setOpenAddMemberOnLoad}
          />
        );
      case 'payments':
        return (
          <PaymentsPage
            openRecordModalOnLoad={openRecordPaymentOnLoad}
            setOpenRecordPaymentOnLoad={setOpenRecordPaymentOnLoad}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            memberId={selectedProfileMemberId}
            setActivePage={setActivePage}
          />
        );
      case 'reports':
        return <ReportsPage />;
      default:
        return (
          <DashboardPage
            setActivePage={setActivePage}
            setOpenAddMemberOnLoad={setOpenAddMemberOnLoad}
            setOpenRecordPaymentOnLoad={setOpenRecordPaymentOnLoad}
          />
        );
    }
  };

  const handleLogin = ({ token, user, rememberMe }) => {
    setAuthToken(token);
    setCurrentUser(user);

    if (rememberMe && token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }

    localStorage.removeItem('gymfitness_auth');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('gymfitness_auth');
    setAuthToken('');
    setCurrentUser(null);
    setActivePage('dashboard');
    setSelectedProfileMemberId(null);
    setIsAuthenticated(false);
  };

  if (!authChecked) {
    return (
      <main className="login-page" aria-label="Checking saved session">
        <section className="login-card">
          <div className="login-brand">
            <div>
              <h1>Gym<span>Fitness</span></h1>
              <p>Checking your secure session...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} requestAuth={requestAuth} />;
  }

  return (
    <GymProvider authToken={authToken}>
      <div className="page-shell">
        <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} currentUser={currentUser} />
        <main className="main-content">
          {renderActivePage()}
        </main>
      </div>
      <div className="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>
    </GymProvider>
  );
}

export default App;
