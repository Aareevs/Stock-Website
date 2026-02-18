import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { UserLogin } from './components/auth/UserLogin';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ViewState, User, MarketItem, NewsEvent } from './types';
import { INITIAL_MARKET_ITEMS } from './constants';
import { generateUsers } from './data/users';
import { tickAllPrices, applyNewsEvent, stopNewsEvent } from './engine/priceEngine';

const STORAGE_KEY = 'novatrade_users';
const MARKET_KEY = 'novatrade_market';
const LOGGED_IN_KEY = 'novatrade_logged_in';
const NEWS_KEY = 'novatrade_news';

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

  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>(() => {
    const saved = localStorage.getItem(NEWS_KEY);
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Save market to localStorage
  useEffect(() => {
    localStorage.setItem(MARKET_KEY, JSON.stringify(marketItems));
  }, [marketItems]);

  // Save news events to localStorage
  useEffect(() => {
    localStorage.setItem(NEWS_KEY, JSON.stringify(newsEvents));
  }, [newsEvents]);

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

  const handleResetSimulation = () => {
    // Clear all localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MARKET_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(NEWS_KEY);

    // Regenerate fresh state
    const freshUsers = generateUsers();
    setUsers(freshUsers);
    setMarketItems(INITIAL_MARKET_ITEMS);
    setNewsEvents([]);
    setLoggedInUserId(null);
    setView(ViewState.DASHBOARD);
  };

  const handleTriggerNewsEvent = (event: NewsEvent) => {
    setMarketItems(prev => applyNewsEvent(prev, event));
    setNewsEvents(prev => [event, ...prev]);
  };

  const handleStopNewsEvent = (eventId: string) => {
    setNewsEvents(prev => {
      const updated = prev.map(e => e.id === eventId ? { ...e, active: false } : e);
      const stoppedEvent = prev.find(e => e.id === eventId);
      if (stoppedEvent) {
        setMarketItems(items => stopNewsEvent(items, stoppedEvent));
      }
      return updated;
    });
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
          newsEvents={newsEvents}
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
          newsEvents={newsEvents}
          onBack={() => setView(ViewState.DASHBOARD)}
          onResetSimulation={handleResetSimulation}
          onTriggerNewsEvent={handleTriggerNewsEvent}
          onStopNewsEvent={handleStopNewsEvent}
        />
      )}
    </>
  );
};

export default App;