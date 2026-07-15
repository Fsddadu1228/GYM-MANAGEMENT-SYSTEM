import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import { GymProvider } from './context/GymContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('gymfitness_auth') === 'true';
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedProfileMemberId, setSelectedProfileMemberId] = useState(null);
  
  // Navigation redirection triggers
  const [openAddMemberOnLoad, setOpenAddMemberOnLoad] = useState(false);
  const [openRecordPaymentOnLoad, setOpenRecordPaymentOnLoad] = useState(false);

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

  const handleLogin = ({ rememberMe }) => {
    if (rememberMe) {
      localStorage.setItem('gymfitness_auth', 'true');
    } else {
      localStorage.removeItem('gymfitness_auth');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('gymfitness_auth');
    setActivePage('dashboard');
    setSelectedProfileMemberId(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <GymProvider>
      <div className="page-shell">
        <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
        <main className="main-content">
          {renderActivePage()}
        </main>
      </div>
      <div className="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>
    </GymProvider>
  );
}

export default App;
