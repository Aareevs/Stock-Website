import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { AuthModal } from './components/auth/AuthModal';
import { ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogin = () => {
    // Simulate auth flow
    setShowAuthModal(false);
    setView(ViewState.DASHBOARD);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setView(ViewState.LANDING);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLogin}
      />
      
      {view === ViewState.LANDING ? (
        <LandingPage 
          onLogin={handleLogin} 
          onOpenAuth={() => setShowAuthModal(true)}
        />
      ) : (
        <DashboardLayout onLogout={handleLogout} />
      )}
    </>
  );
};

export default App;