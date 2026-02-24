import React, { useState } from "react";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { UserLogin } from "./components/auth/UserLogin";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { useAuth } from "./components/auth/AuthProvider";
import { useMarket } from "./hooks/useMarket";
import { useNews } from "./hooks/useNews";
import { usePortfolio } from "./hooks/usePortfolio";
import { supabase } from "./lib/supabaseClient";

const STARTING_CAPITAL = 100000; // ₹1 Lakh

type View = "dashboard" | "admin_login" | "admin_dashboard";

const App: React.FC = () => {
  const {
    profile,
    user,
    loading: authLoading,
    signOut,
    isAdmin,
    refreshProfile,
  } = useAuth();
  const { marketItems, setMarketItems, loading: marketLoading } = useMarket();
  const { newsEvents, loading: newsLoading, triggerNews, stopNews } = useNews();
  const {
    portfolio,
    transactions,
    loading: portfolioLoading,
    executeTrade,
  } = usePortfolio(user?.id);

  const [view, setView] = useState<View>("dashboard");

  // Show loading state
  if (authLoading || marketLoading) {
    console.log("App loading:", { authLoading, marketLoading });
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

        // Clear all portfolios - use neq to match all rows
        const { error: portfolioError } = await supabase
          .from("portfolios")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (portfolioError) throw portfolioError;

        // Clear all transactions - use neq to match all rows
        const { error: txError } = await supabase
          .from("transactions")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (txError) throw txError;

        // DELETE all news events - use neq to match all rows
        const { error: newsError } = await supabase
          .from("news_events")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (newsError) throw newsError;

        // Reset market prices
        const initialPrices: Record<string, number> = {
          VELOCITY: 1250.0,
          APEXAUTO: 850.0,
          CRUISER: 2150.0,
          VITALIS: 1650.0,
          CAREPLUS: 3400.0,
          MEDISURG: 920.0,
          EDUNEXT: 540.0,
          SCHOLAR: 890.0,
          BRAINB: 1120.0,
          FRESHC: 430.0,
          SPICER: 1750.0,
          URBANB: 220.0,
        };

        for (const [symbol, price] of Object.entries(initialPrices)) {
          await supabase
            .from("market_items")
            .update({
              price,
              change: 0,
              sentiment: "Neutral",
              price_history: [],
            })
            .eq("symbol", symbol);
        }

        // Force page reload to refresh all data
        window.location.reload();

        return { error: null };
      } catch (err: any) {
        console.error("Reset error:", err);
        return { error: err.message || "Failed to reset auction" };
      }
    };

    return (
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
      />
    );
  }

  // Main dashboard
  return (
    <DashboardLayout
      profile={profile}
      marketItems={marketItems}
      newsEvents={newsEvents}
      portfolio={portfolio}
      transactions={transactions}
      onExecuteTrade={executeTrade}
      onLogout={signOut}
      onOpenAdmin={() => setView(isAdmin ? "admin_dashboard" : "admin_login")}
      isAdmin={isAdmin}
      onRefreshProfile={refreshProfile}
    />
  );
};

export default App;
