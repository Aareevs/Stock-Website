import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { UserLogin } from './components/auth/UserLogin';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ViewState, User, MarketItem, NewsEvent } from './types';
import { INITIAL_MARKET_ITEMS } from './constants';
import { generateUsers } from './data/users';
import { tickAllPrices, applyNewsEvent, stopNewsEvent } from './engine/priceEngine';
import { useSync, SyncMessage } from './hooks/useSync';

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

  // ─── WebSocket real-time sync ───
  const handleSyncMessage = (msg: SyncMessage) => {
    switch (msg.type) {
      case 'NEWS_TRIGGERED': {
        const event = msg.payload.event as NewsEvent;
        const updatedMarket = msg.payload.market as MarketItem[];
        setNewsEvents(prev => [event, ...prev]);
        setMarketItems(updatedMarket);
        break;
      }
      case 'NEWS_STOPPED': {
        const { eventId, market: stoppedMarket } = msg.payload as any;
        setNewsEvents(prev => prev.map(e => e.id === eventId ? { ...e, active: false } : e));
        setMarketItems(stoppedMarket);
        break;
      }
      case 'MARKET_UPDATE': {
        setMarketItems(msg.payload);
        break;
      }
      case 'SIMULATION_RESET': {
        const freshUsers = generateUsers();
        setUsers(freshUsers);
        setMarketItems(INITIAL_MARKET_ITEMS);
        setNewsEvents([]);
        setLoggedInUserId(null);
        localStorage.removeItem(LOGGED_IN_KEY);
        setView(ViewState.DASHBOARD);
        break;
      }
    }
  };

  const { broadcast } = useSync(handleSyncMessage);

  // ─── Persist to localStorage ───
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(MARKET_KEY, JSON.stringify(marketItems));
  }, [marketItems]);

  useEffect(() => {
    localStorage.setItem(NEWS_KEY, JSON.stringify(newsEvents));
  }, [newsEvents]);

  // ─── Price tick every 5 seconds ───
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketItems(prev => tickAllPrices(prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Handlers ───
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MARKET_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(NEWS_KEY);

    const freshUsers = generateUsers();
    setUsers(freshUsers);
    setMarketItems(INITIAL_MARKET_ITEMS);
    setNewsEvents([]);
    setLoggedInUserId(null);
    setView(ViewState.DASHBOARD);

    // Broadcast reset to all participants
    broadcast({ type: 'SIMULATION_RESET' });
  };

  const handleTriggerNewsEvent = (event: NewsEvent) => {
    const updatedMarket = applyNewsEvent(marketItems, event);
    setMarketItems(updatedMarket);
    setNewsEvents(prev => [event, ...prev]);

    // Broadcast to all participants
    broadcast({
      type: 'NEWS_TRIGGERED',
      payload: { event, market: updatedMarket },
    });
  };

  const handleStopNewsEvent = (eventId: string) => {
    const stoppedEvent = newsEvents.find(e => e.id === eventId);
    if (!stoppedEvent) return;

    const updatedMarket = stopNewsEvent(marketItems, stoppedEvent);
    setMarketItems(updatedMarket);
    setNewsEvents(prev => prev.map(e => e.id === eventId ? { ...e, active: false } : e));

    // Broadcast to all participants
    broadcast({
      type: 'NEWS_STOPPED',
      payload: { eventId, market: updatedMarket },
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