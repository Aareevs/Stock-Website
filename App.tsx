import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { UserLogin } from "./components/auth/UserLogin";
import { AdminLogin } from "./components/admin/AdminLogin";

// Lazy-load admin dashboard (heavy: Recharts + graphData + zoom logic)
const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
import { useAuth } from "./components/auth/AuthProvider";
import { useMarket } from "./hooks/useMarket";
import { useNews } from "./hooks/useNews";
import { usePortfolio } from "./hooks/usePortfolio";
import { supabase } from "./lib/supabaseClient";
import { getGraphPrice } from "./engine/graphPlaybackEngine";
import { SCHEDULED_NEWS } from "./data/scheduledNews";

const STARTING_CAPITAL = 100000; // ₹1 Lakh

type View = "dashboard" | "admin_login" | "admin_dashboard";

const SYMBOLS = [
  "VELOCITY",
  "APEXAUTO",
  "CRUISER",
  "VITALIS",
  "CAREPLUS",
  "MEDISURG",
  "EDUNEXT",
  "SCHOLAR",
  "BRAINB",
  "FRESHC",
  "SPICER",
  "URBANB",
];

const App: React.FC = () => {
  const {
    profile,
    user,
    loading: authLoading,
    signOut,
    isAdmin,
    refreshProfile,
  } = useAuth();
  const {
    marketItems,
    setMarketItems,
    loading: marketLoading,
    setActiveNews,
    resetTicks,
    getTicks,
    simState,
    elapsedSeconds,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    skipToTick,
  } = useMarket();
  const { newsEvents, loading: newsLoading, triggerNews, stopNews } = useNews();
  const {
    portfolio,
    transactions,
    loading: portfolioLoading,
    executeTrade,
  } = usePortfolio(user?.id);

  const [view, setViewState] = useState<View>(() => {
    const saved = localStorage.getItem("vsx_view");
    return (saved as View) || "dashboard";
  });

  const setView = (newView: View) => {
    localStorage.setItem("vsx_view", newView);
    setViewState(newView);
  };

  // Keep useMarket in sync with active news events
  useEffect(() => {
    setActiveNews(newsEvents);
  }, [newsEvents, setActiveNews]);

  // --- Auto-trigger scheduled news flashes ---
  const triggeredRef = useRef<Set<number>>(new Set());
  const stoppedRef = useRef<Set<number>>(new Set());
  // Track news event IDs returned from triggering so we can auto-stop them
  const scheduledEventIdsRef = useRef<Map<number, string>>(new Map());

  // Stable refs for values used in the auto-trigger effect
  // This avoids putting unstable function refs (triggerNews, stopNews) in the dep array
  const triggerNewsRef = useRef(triggerNews);
  triggerNewsRef.current = triggerNews;
  const stopNewsRef = useRef(stopNews);
  stopNewsRef.current = stopNews;
  const marketItemsRef = useRef(marketItems);
  marketItemsRef.current = marketItems;
  const newsEventsRef = useRef(newsEvents);
  newsEventsRef.current = newsEvents;

  // Reset tracking when simulation resets to idle
  useEffect(() => {
    if (simState === 'idle') {
      triggeredRef.current = new Set();
      stoppedRef.current = new Set();
      scheduledEventIdsRef.current = new Map();
    }
  }, [simState]);

  // Auto-trigger and auto-stop scheduled events
  useEffect(() => {
    // ONLY the admin client should serve as the "cron" to prevent multiple clients from triggering identical events.
    // We MUST also wait for newsLoading to finish. Otherwise, on a page refresh, we'll evaluate 
    // before we've fetched the existing database state, falsely assuming the event hasn't fired yet!
    if (simState !== 'running' || !user || profile?.role !== 'admin' || newsLoading) return;

    for (const scheduled of SCHEDULED_NEWS) {
      const endTick = scheduled.triggerTick + scheduled.durationTicks;
      
      // Check database state directly rather than relying purely on volatile React refs.
      // This survives admin page reloads and cross-device syncs.
      const existingEvents = newsEventsRef.current.filter(e => e.headline === scheduled.headline);

      // ─── Case 1: Event is fully in the past or just ended ───
      if (elapsedSeconds >= endTick) {
        let stoppedAny = false;
        existingEvents.forEach(existingEvent => {
          if (existingEvent.active && !stoppedRef.current.has(scheduled.triggerTick)) {
            stoppedAny = true;
            stopNewsRef.current(existingEvent.id, existingEvent, marketItemsRef.current).catch(err => {
              console.error('[AutoNews] Failed to stop past event:', err);
            });
          }
        });
        if (stoppedAny) {
          stoppedRef.current.add(scheduled.triggerTick);
        }
        continue;
      }

      // ─── Case 2: Currently inside the event's active window ───
      if (elapsedSeconds >= scheduled.triggerTick && elapsedSeconds < endTick) {
        const hasActiveEvent = existingEvents.some(e => e.active);
        if (!hasActiveEvent && !triggeredRef.current.has(scheduled.triggerTick)) {
          triggeredRef.current.add(scheduled.triggerTick);
          triggerNewsRef.current(
            scheduled.headline,
            scheduled.crashCompany,
            scheduled.crashPercent,
            scheduled.boostCompanies,
            scheduled.boostPercent,
            marketItemsRef.current,
            user.id,
          ).catch((err) => {
            console.error('[AutoNews] Failed to trigger scheduled event:', err);
          });
        }
      }
    }
  }, [elapsedSeconds, simState, user, profile?.role, newsLoading]);

  // Show loading state
  if (authLoading || marketLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-textMuted text-sm">Loading VSX...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show login
  if (!user || !profile) {
    if (view === "admin_login") {
      return (
        <AdminLogin
          onLogin={() => setView("admin_dashboard")}
          onBack={() => setView("dashboard")}
        />
      );
    }
    return <UserLogin onOpenAdmin={() => setView("admin_login")} />;
  }

  // Admin dashboard
  if (view === "admin_dashboard" && isAdmin) {
    const handleTriggerNews = async (
      crashSymbol: string,
      crashPercent: number,
      boostSymbols: string[],
      boostPercent: number,
      headline: string,
    ) => {
      const result = await triggerNews(
        headline,
        crashSymbol,
        crashPercent,
        boostSymbols,
        boostPercent,
        marketItems,
        user!.id,
      );
      return { error: result.error ?? null };
    };

    const handleStopNews = async (eventId: string) => {
      const event = newsEvents.find((e) => e.id === eventId);
      if (!event) return { error: "Event not found" };
      await stopNews(eventId, event, marketItems);
      return { error: null };
    };

    const handleResetAuction = async () => {
      try {
        // Reset all participant cash balances
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            cash_balance: STARTING_CAPITAL,
            starting_capital: STARTING_CAPITAL,
          })
          .eq("role", "participant");
        if (profileError) throw profileError;

        // Clear all portfolios
        const { error: portfolioError } = await supabase
          .from("portfolios")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (portfolioError) throw portfolioError;

        // Clear all transactions
        const { error: txError } = await supabase
          .from("transactions")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (txError) throw txError;

        // DELETE all news events
        const { error: newsError } = await supabase
          .from("news_events")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (newsError) throw newsError;

        // Reset market prices to graph starting prices (tick 0)
        for (const symbol of SYMBOLS) {
          const startPrice = getGraphPrice(symbol, 0);
          await supabase
            .from("market_items")
            .update({
              price: startPrice,
              change: 0,
              sentiment: "Neutral",
              price_history: [],
            })
            .eq("symbol", symbol);
        }

        // Reset tick counters to 0
        resetTicks();

        // Reset client-side market items to graph starting state
        setMarketItems((prev) =>
          prev.map((item) => ({
            ...item,
            price: getGraphPrice(item.symbol, 0),
            change: 0,
            sentiment: "Neutral" as const,
            priceHistory: [],
            price_history: [],
          })),
        );

        // Force page reload to refresh all data
        window.location.reload();

        return { error: null };
      } catch (err: any) {
        console.error("Reset error:", err);
        return { error: err.message || "Failed to reset auction" };
      }
    };

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-textMuted text-lg animate-pulse">
              Loading Admin Dashboard...
            </div>
          </div>
        }
      >
        <AdminDashboard
          profile={profile}
          marketItems={marketItems}
          newsEvents={newsEvents}
          onBack={() => {
            signOut();
            setView("dashboard");
          }}
          onTriggerNews={handleTriggerNews}
          onStopNews={handleStopNews}
          onResetAuction={handleResetAuction}
          getTicks={getTicks}
          simState={simState}
          elapsedSeconds={elapsedSeconds}
          onStartSim={startSimulation}
          onPauseSim={pauseSimulation}
          onResetSim={resetSimulation}
          onSkipTo={skipToTick}
        />
      </Suspense>
    );
  }

  // Main dashboard — NO graphData passed here (security: Part 8)
  return (
    <DashboardLayout
      profile={profile}
      marketItems={marketItems}
      newsEvents={newsEvents}
      portfolio={portfolio}
      transactions={transactions}
      onExecuteTrade={executeTrade}
      onLogout={() => {
        signOut();
        setView("dashboard");
      }}
      onOpenAdmin={() => setView(isAdmin ? "admin_dashboard" : "admin_login")}
      isAdmin={isAdmin}
      onRefreshProfile={refreshProfile}
      elapsedSeconds={elapsedSeconds}
      simState={simState}
    />
  );
};

export default App;
