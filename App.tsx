import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { UserLogin } from './components/auth/UserLogin';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ViewState, User, MarketItem } from './types';
import { INITIAL_MARKET_ITEMS } from './constants';
import { generateUsers } from './data/users';
import { tickAllPrices } from './engine/priceEngine';

const STORAGE_KEY = 'novatrade_users';
const MARKET_KEY = 'novatrade_market';
const LOGGED_IN_KEY = 'novatrade_logged_in';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(() => {
    const loggedIn = localStorage.getItem(LOGGED_IN_KEY);
    return loggedIn ? ViewState.DASHBOARD : ViewState.DASHBOARD;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const initial = generateUsers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  });

  const [marketItems, setMarketItems] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem(MARKET_KEY);
    if (saved) return JSON.parse(saved);
    return INITIAL_MARKET_ITEMS;
  });

  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => {
    return localStorage.getItem(LOGGED_IN_KEY);
  });

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Save market to localStorage
  useEffect(() => {
    localStorage.setItem(MARKET_KEY, JSON.stringify(marketItems));
  }, [marketItems]);

  // 5-second price tick
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketItems(prev => tickAllPrices(prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUserLogin = (userId: string) => {
    setLoggedInUserId(userId);
    localStorage.setItem(LOGGED_IN_KEY, userId);
    setView(ViewState.DASHBOARD);
  };

  const handleUserLogout = () => {
    setLoggedInUserId(null);
    localStorage.removeItem(LOGGED_IN_KEY);
  };

  const handleAdminLogin = () => {
    setView(ViewState.ADMIN_DASHBOARD);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const currentUser = users.find(u => u.id === loggedInUserId) || null;

  // Show login page if no user is logged in and not in admin flow
  if (!currentUser && view !== ViewState.ADMIN_LOGIN && view !== ViewState.ADMIN_DASHBOARD) {
    return (
      <UserLogin
        users={users}
        onLogin={handleUserLogin}
        onOpenAdmin={() => setView(ViewState.ADMIN_LOGIN)}
      />
    );
  }

  return (
    <>
      {view === ViewState.DASHBOARD && (
        <DashboardLayout
          currentUser={currentUser!}
          users={users}
          marketItems={marketItems}
          onUpdateUser={handleUpdateUser}
          onLogout={handleUserLogout}
          onOpenAdmin={() => setView(ViewState.ADMIN_LOGIN)}
        />
      )}

      {view === ViewState.ADMIN_LOGIN && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={() => setView(ViewState.DASHBOARD)}
        />
      )}

      {view === ViewState.ADMIN_DASHBOARD && (
        <AdminDashboard
          users={users}
          marketItems={marketItems}
          onBack={() => setView(ViewState.DASHBOARD)}
        />
      )}
    </>
  );
};

export default App;