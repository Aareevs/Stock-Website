# Codebase Context

This file contains the full context of the codebase to be used by LLMs.
Generated at: 2026-02-25T21:37:55.012Z

## File: `App.tsx`

```tsx
import React, { useState, useEffect, Suspense, lazy } from "react";
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
    />
  );
};

export default App;

```

## File: `README.md`

```markdown
# 📈 VSX: Buy or Bail

**VSX: Buy or Bail** is a real-time virtual stock market simulation built for **NOESIS Tech Fest**, hosted by **Vedam School of Technology**. Participants compete by trading fictional stocks, reacting to live market news events, and building the most profitable portfolio — all within a sleek, interactive dashboard.

---

## 🎯 What Is It?

A competitive stock market simulation where participants start with ₹1,00,000 in virtual cash. Stocks tick every 5 seconds with realistic price movements influenced by market sentiment. Admins can trigger breaking news events that crash or boost specific companies — forcing players to make quick buy-or-bail decisions.

---

## ✨ Features

### For Participants

- **Live Market Dashboard** — Real-time stock prices updating every 5 seconds with dynamic sparkline graphs
- **Buy & Sell Stocks** — Trade 12 fictional Indian companies with a simple trade modal
- **Portfolio Tracking** — Monitor holdings, average buy price, current value, and P&L in real time
- **Stock Detail View** — Click any company for a full-screen price chart with Open/High/Low stats
- **Transaction History** — Complete log of all your BUY and SELL trades
- **Net Worth Tracking** — Cash balance + stock value combined into a total net worth
- **Market News Feed** — Breaking news events with live impact indicators (crashing/benefiting companies)
- **Toast Notifications** — Instant pop-up alerts when new market events are triggered

### For Admins

- **Admin Dashboard** — Protected panel accessible only to authorized admin accounts
- **News Flash System** — Create breaking news events that instantly crash one company and boost competitors
- **Live Market Overview** — Monitor all stock prices and sparklines from the admin panel
- **Event Management** — Activate/deactivate news events to control market dynamics

### Technical

- **Real-time Price Engine** — Client-side price ticking with sentiment-based volatility (Bullish/Bearish/Neutral)
- **Supabase Realtime** — Instant push updates for admin-triggered events via PostgreSQL changes
- **Authentication** — Email/password sign-up and login with auto-generated user profiles
- **Responsive Design** — Works across desktop and mobile devices

---

## 🏗️ Tech Stack

| Layer                   | Technology                              |
| ----------------------- | --------------------------------------- |
| **Framework**           | React 19                                |
| **Language**            | TypeScript                              |
| **Build Tool**          | Vite 6                                  |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + Realtime) |
| **Charting**            | Recharts                                |
| **Icons**               | Lucide React                            |
| **Deployment**          | Vercel                                  |

---

## 📂 Project Structure

```
├── App.tsx                  # Main app — auth flow, routing, data fetching
├── index.tsx                # React entry point
├── index.html               # HTML shell
├── types.ts                 # Shared TypeScript interfaces
├── constants.ts             # Market item definitions & seed data
├── vite.config.ts           # Vite configuration
├── vercel.json              # Vercel deployment config
│
├── components/
│   ├── auth/                # Authentication components
│   │   ├── AuthProvider.tsx  # Supabase auth context & session management
│   │   ├── AuthModal.tsx     # Sign-up / sign-in modal
│   │   └── UserLogin.tsx     # Landing page with login form
│   ├── dashboard/           # Main dashboard UI
│   │   ├── DashboardLayout.tsx  # Overview, Markets, Portfolio, News tabs
│   │   ├── Charts.tsx        # MainChart, MiniSparkline, SentimentChart, StockChart
│   │   ├── StockDetailChart.tsx # Full-screen stock detail view
│   │   ├── TradeModal.tsx    # Buy/Sell trade dialog
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── admin/               # Admin panel
│   │   ├── AdminDashboard.tsx # News event creation & market management
│   │   └── AdminLogin.tsx    # Admin authentication gate
│   └── ui/                  # Reusable UI primitives (Card, Button)
│
├── hooks/
│   ├── useMarket.ts         # Market data fetching, realtime, & price ticking
│   ├── usePortfolio.ts      # Portfolio & transaction management
│   └── useNews.ts           # News events subscription
│
├── engine/
│   └── priceEngine.ts       # Price simulation: tick, history generation, news impact
│
├── lib/
│   └── supabaseClient.ts    # Supabase client initialization
│
├── sql/                     # Database schema & migrations
│   ├── schema.sql           # Full schema: profiles, market_items, portfolios, transactions, news_events
│   ├── seed-users.sql       # Seed participant accounts
│   ├── reset-auction.sql    # Reset all balances & portfolios for a fresh round
│   └── enable-realtime.sql  # Enable Supabase realtime on tables
│
└── scripts/                 # Utility scripts
    ├── seed-users.mjs       # Bulk seed user accounts
    └── test-supabase.mjs    # Test Supabase connection
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/your-username/Stock-Website.git
cd Stock-Website
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

Run the SQL schema in your Supabase SQL Editor:

```sql
-- Run sql/schema.sql to create all tables, policies, triggers, and seed market data
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 How It Works

1. **Participants sign up** with a username and password, starting with ₹1,00,000
2. **12 fictional stocks** tick every 5 seconds with realistic volatility
3. **Players buy and sell** stocks to grow their portfolio value
4. **Admins trigger news events** — a company crashes while competitors surge
5. **Players react** — buy the dip, sell the panic, or bail entirely
6. **Highest net worth wins** at the end of the event

---

## 🏛️ Event Details

|               |                            |
| ------------- | -------------------------- |
| **Event**     | VSX: Buy or Bail           |
| **Tech Fest** | NOESIS                     |
| **Hosted By** | Vedam School of Technology |

---

## 📄 License

This project is private and built for the NOESIS Tech Fest event.

```

## File: `components/admin/AdminDashboard.tsx`

```tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Trophy,
  Users,
  BarChart2,
  X,
  TrendingUp,
  TrendingDown,
  Newspaper,
  RotateCcw,
  Zap,
  AlertTriangle,
  ChevronDown,
  Check,
  RefreshCw,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StockChart, MiniSparkline } from "../dashboard/Charts";
import { AdminUsers } from "./AdminUsers";
import { graphData } from "../../data/graphData";
import type { StockDataPoint } from "../../types";
import type { Profile } from "../auth/AuthProvider";
import type { MarketItem } from "../../hooks/useMarket";
import type { NewsEvent } from "../../hooks/useNews";

interface AdminDashboardProps {
  profile: Profile;
  marketItems: MarketItem[];
  newsEvents: NewsEvent[];
  onBack: () => void;
  onTriggerNews: (
    crashSymbol: string,
    crashPercent: number,
    boostSymbols: string[],
    boostPercent: number,
    headline: string,
  ) => Promise<{ error: string | null }>;
  onStopNews: (eventId: string) => Promise<{ error: string | null }>;
  onResetAuction: () => Promise<{ error: string | null }>;
  getTicks: () => Record<string, number>;
}

/**
 * Convert the full graph data array for a symbol into StockDataPoint[]
 * for rendering the complete Excel timeline in admin charts.
 */
function getFullGraphTimeline(symbol: string): StockDataPoint[] {
  const prices = graphData[symbol as keyof typeof graphData];
  if (!prices || prices.length === 0) return [];

  return prices.map((value, i) => ({
    time: `${i}s`,
    value: parseFloat(Math.max(10, value).toFixed(2)),
  }));
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profile,
  marketItems,
  newsEvents,
  onBack,
  onTriggerNews,
  onStopNews,
  onResetAuction,
  getTicks,
}) => {
  const [activeView, setActiveView] = useState<"charts" | "news" | "users">(
    "news",
  );
  const [selectedChart, setSelectedChart] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // News event form state
  const [crashSymbol, setCrashSymbol] = useState("");
  const [crashPercent, setCrashPercent] = useState(15);
  const [boostSymbols, setBoostSymbols] = useState<string[]>([]);
  const [boostPercent, setBoostPercent] = useState(8);
  const [boostDropdownOpen, setBoostDropdownOpen] = useState(false);

  // Get current tick for the selected stock
  const currentTick = selectedChart
    ? (getTicks()[selectedChart.symbol] ?? 0)
    : 0;

  // Memoize full graph timeline for the selected stock
  const fullTimeline = useMemo(() => {
    if (!selectedChart) return [];
    return getFullGraphTimeline(selectedChart.symbol);
  }, [selectedChart?.symbol]);

  const toggleBoostSymbol = (symbol: string) => {
    setBoostSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  const generateHeadline = () => {
    const crashCompany = marketItems.find((m) => m.symbol === crashSymbol);
    if (!crashCompany) return "Breaking News: Market Disruption";
    const headlines = [
      `BREAKING: ${crashCompany.name} CEO Steps Down Amid Controversy`,
      `FLASH: ${crashCompany.name} Reports Major Quarterly Loss`,
      `ALERT: ${crashCompany.name} Faces Regulatory Investigation`,
      `SHOCK: ${crashCompany.name} Data Breach Exposes Millions`,
      `CRISIS: ${crashCompany.name} Supply Chain Collapse`,
    ];
    return headlines[Math.floor(Math.random() * headlines.length)];
  };

  const handleTriggerNews = async () => {
    if (!crashSymbol) return;
    await onTriggerNews(
      crashSymbol,
      -crashPercent,
      boostSymbols,
      boostPercent,
      generateHeadline(),
    );
    setCrashSymbol("");
    setBoostSymbols([]);
    setCrashPercent(15);
    setBoostPercent(8);
  };

  const handleResetAuction = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setIsResetting(true);
    await onResetAuction();
    setIsResetting(false);
    setResetConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-textMuted" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">VSX Admin</h1>
              <p className="text-sm text-textMuted">
                Competition Management Dashboard
              </p>
            </div>
          </div>

          {/* Reset Auction Button */}
          <div className="flex items-center gap-2">
            {resetConfirm && (
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-2 text-sm text-textMuted hover:text-textMain transition-colors"
              >
                Cancel
              </button>
            )}
            <Button
              variant={resetConfirm ? "primary" : "ghost"}
              size="sm"
              onClick={handleResetAuction}
              disabled={isResetting}
              className={
                resetConfirm
                  ? "bg-red-500 hover:bg-red-600"
                  : "border border-red-500/30 text-red-400 hover:bg-red-500/10"
              }
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : resetConfirm ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Confirm Reset
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Auction
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-textMuted">Active Stocks</span>
            </div>
            <div className="text-3xl font-bold">{marketItems.length}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-textMuted">News Events</span>
            </div>
            <div className="text-3xl font-bold">{newsEvents.length}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-textMuted">Active Flashes</span>
            </div>
            <div className="text-3xl font-bold">
              {newsEvents.filter((e) => e.active).length}
            </div>
          </Card>
          <Card
            className="bg-gradient-to-br from-surface to-surfaceElevated cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setActiveView("users")}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-textMuted">Participants</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">→</div>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeView === "charts" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveView("charts")}
          >
            <BarChart2 className="w-4 h-4 mr-1" /> All Charts
          </Button>
          <Button
            variant={activeView === "news" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveView("news")}
          >
            <Newspaper className="w-4 h-4 mr-1" /> News Events
          </Button>
          <Button
            variant={activeView === "users" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveView("users")}
          >
            <Users className="w-4 h-4 mr-1" /> Users
          </Button>
        </div>

        {activeView === "charts" && (
          <div className="space-y-6">
            {selectedChart ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setSelectedChart(null)}
                    className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-textMuted" />
                  </button>
                  <h3 className="text-xl font-bold">
                    {selectedChart.name} ({selectedChart.symbol})
                  </h3>
                  <span
                    className={`text-sm font-semibold ${(selectedChart.change ?? 0) >= 0 ? "text-primary" : "text-negative"}`}
                  >
                    {(selectedChart.change ?? 0) >= 0 ? "+" : ""}
                    {(selectedChart.change ?? 0).toFixed(2)}%
                  </span>
                  <span className="text-xs text-textMuted ml-auto">
                    Tick: {currentTick} / {fullTimeline.length}
                  </span>
                </div>

                {/* Full Excel Timeline — ADMIN ONLY */}
                <Card padding="sm">
                  <div className="text-xs text-textMuted mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-0.5 bg-primary rounded"></span>{" "}
                    Past (played)
                    <span
                      className="inline-block w-3 h-0.5 bg-textMuted/30 rounded"
                      style={{ borderTop: "2px dashed" }}
                    ></span>{" "}
                    Future (upcoming)
                  </div>
                  <AdminFullChart
                    data={fullTimeline}
                    currentTick={currentTick}
                  />
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketItems.map((item) => (
                  <Card
                    key={item.symbol}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    hoverEffect
                    onClick={() => setSelectedChart(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-textMain">
                          {item.name}
                        </div>
                        <div className="text-xs text-textMuted">
                          {item.symbol}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          ₹{(item.price ?? 0).toFixed(2)}
                        </div>
                        <div
                          className={`text-xs font-semibold ${(item.change ?? 0) >= 0 ? "text-primary" : "text-negative"}`}
                        >
                          {(item.change ?? 0) >= 0 ? "+" : ""}
                          {(item.change ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <MiniSparkline
                      data={(item.priceHistory || []).slice(-30)}
                      color={(item.change ?? 0) >= 0 ? "#1ED3A6" : "#EF4444"}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "users" && <AdminUsers marketItems={marketItems} />}

        {activeView === "news" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create News Flash */}
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold">Trigger News Flash</h3>
              </div>

              <div className="space-y-5">
                {/* Crash Company */}
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                    Company to Crash
                  </label>
                  <select
                    value={crashSymbol}
                    onChange={(e) => {
                      setCrashSymbol(e.target.value);
                      setBoostSymbols((prev) =>
                        prev.filter((s) => s !== e.target.value),
                      );
                    }}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select a company...</option>
                    {marketItems.map((item) => (
                      <option key={item.symbol} value={item.symbol}>
                        {item.name} ({item.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crash Percent */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                      Crash Severity
                    </label>
                    <span className="text-sm font-bold text-negative">
                      -{crashPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={crashPercent}
                    onChange={(e) => setCrashPercent(Number(e.target.value))}
                    className="w-full accent-negative"
                  />
                  <div className="flex justify-between text-xs text-textMuted mt-1">
                    <span>Minor (-5%)</span>
                    <span>Severe (-30%)</span>
                  </div>
                </div>

                {/* Boost Companies */}
                <div>
                  <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                    Companies that Benefit
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setBoostDropdownOpen(!boostDropdownOpen)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-left text-sm text-textMain focus:outline-none focus:border-primary/50 flex items-center justify-between"
                    >
                      <span
                        className={
                          boostSymbols.length
                            ? "text-textMain"
                            : "text-textMuted"
                        }
                      >
                        {boostSymbols.length
                          ? `${boostSymbols.length} companies selected`
                          : "Select companies..."}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-textMuted transition-transform ${boostDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {boostDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {marketItems
                          .filter((item) => item.symbol !== crashSymbol)
                          .map((item) => (
                            <button
                              key={item.symbol}
                              onClick={() => toggleBoostSymbol(item.symbol)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surfaceElevated transition-colors text-left"
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  boostSymbols.includes(item.symbol)
                                    ? "bg-primary border-primary"
                                    : "border-border"
                                }`}
                              >
                                {boostSymbols.includes(item.symbol) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span>{item.name}</span>
                              <span className="text-textMuted text-xs ml-auto">
                                {item.symbol}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {boostSymbols.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {boostSymbols.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold"
                        >
                          {s}
                          <button
                            onClick={() => toggleBoostSymbol(s)}
                            className="hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boost Percent */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                      Boost Amount
                    </label>
                    <span className="text-sm font-bold text-primary">
                      +{boostPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={boostPercent}
                    onChange={(e) => setBoostPercent(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-textMuted mt-1">
                    <span>Mild (+3%)</span>
                    <span>Strong (+15%)</span>
                  </div>
                </div>

                {/* Preview */}
                {crashSymbol && (
                  <div className="bg-surfaceElevated rounded-lg p-4 border border-border">
                    <div className="text-xs text-textMuted uppercase tracking-wider mb-2">
                      Preview
                    </div>
                    <div className="text-sm font-semibold text-orange-400 mb-1">
                      📰 {generateHeadline()}
                    </div>
                    <div className="text-xs text-textMuted">
                      {marketItems.find((m) => m.symbol === crashSymbol)?.name}{" "}
                      drops {crashPercent}%
                      {boostSymbols.length > 0 &&
                        ` • ${boostSymbols.join(", ")} rise ${boostPercent}%`}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTriggerNews}
                  disabled={!crashSymbol || newsEvents.some((e) => e.active)}
                  className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    crashSymbol && !newsEvents.some((e) => e.active)
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20"
                      : "bg-surface text-textMuted border border-border cursor-not-allowed"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {newsEvents.some((e) => e.active)
                    ? "Stop active flash first"
                    : "Trigger News Flash"}
                </button>
              </div>
            </Card>

            {/* Past Events */}
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Newspaper className="w-5 h-5 text-textMuted" />
                <h3 className="text-lg font-semibold">Event History</h3>
              </div>

              {newsEvents.length === 0 ? (
                <div className="text-center py-12 text-textMuted">
                  <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No news events triggered yet</p>
                  <p className="text-xs mt-1">
                    Use the form to create your first news flash
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {newsEvents.map((event) => {
                    const crashCompany = marketItems.find(
                      (m) => m.symbol === event.crash_company,
                    );
                    return (
                      <div
                        key={event.id}
                        className={`rounded-lg p-4 border ${event.active ? "bg-orange-500/5 border-orange-500/30" : "bg-surfaceElevated border-border"}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-semibold text-orange-400 flex-1">
                            {event.headline}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {event.active && (
                              <button
                                onClick={() => onStopNews(event.id)}
                                className="px-3 py-1 bg-negative/10 text-negative border border-negative/30 rounded text-xs font-bold hover:bg-negative/20 transition-colors"
                              >
                                Stop Flash
                              </button>
                            )}
                            {!event.active && (
                              <span className="px-2 py-0.5 bg-surface text-textMuted border border-border rounded text-xs font-semibold">
                                Ended
                              </span>
                            )}
                            <span className="text-xs text-textMuted whitespace-nowrap">
                              {new Date(event.created_at).toLocaleString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded font-semibold">
                            <TrendingDown className="w-3 h-3" />
                            {crashCompany?.name || event.crash_company}{" "}
                            {event.crash_percent}%
                          </span>
                          {event.boost_companies.map((sym) => (
                            <span
                              key={sym}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {sym} +{event.boost_percent}%
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AdminFullChart — Renders the FULL Excel timeline with a vertical marker
 * at the current tick position. Past = solid, future = dashed.
 * ADMIN-ONLY component — never used by participant views.
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface AdminFullChartProps {
  data: StockDataPoint[];
  currentTick: number;
}

const AdminFullChart: React.FC<AdminFullChartProps> = ({
  data,
  currentTick,
}) => {
  // Zoom domain: [startIndex, endIndex]
  const [xDomain, setXDomain] = useState<[number, number]>([
    0,
    data.length - 1,
  ]);

  // Reset domain when data changes (e.g. switching stocks)
  useEffect(() => {
    setXDomain([0, data.length - 1]);
  }, [data.length]);

  // Drag-to-pan refs
  const dragRef = useRef<{
    startX: number;
    startDomain: [number, number];
  } | null>(null);

  // Pinch-to-zoom refs
  const pinchRef = useRef<{
    distance: number;
    domain: [number, number];
  } | null>(null);

  // Container ref for native non-passive wheel listener
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Attach non-passive wheel listener to block browser zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevent = (e: WheelEvent) => {
      e.preventDefault();
    };

    el.addEventListener("wheel", prevent, { passive: false });

    return () => {
      el.removeEventListener("wheel", prevent);
    };
  }, []);

  // Indexed data with past/future split — memoized
  const chartData = useMemo(() => {
    return data.map((point, i) => ({
      index: i,
      ...point,
      pastValue: i <= currentTick ? point.value : undefined,
      futureValue: i >= currentTick ? point.value : undefined,
    }));
  }, [data, currentTick]);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-textMuted py-8">
        No graph data available
      </div>
    );
  }

  // --- Helpers ---

  const clampDomain = (start: number, end: number): [number, number] => {
    const minRange = 10;
    const maxIndex = data.length - 1;

    if (end - start < minRange) return xDomain;

    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > maxIndex) {
      const ov = end - maxIndex;
      start -= ov;
      end = maxIndex;
    }

    start = Math.max(0, start);
    end = Math.min(maxIndex, end);

    return [Math.round(start), Math.round(end)];
  };

  // --- Event Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const [start, end] = xDomain;
    const visibleRange = end - start;

    // Cursor position as 0→1 ratio
    const ratio = mouseX / rect.width;
    // Data index under cursor
    const cursorIndex = start + visibleRange * ratio;

    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    const newRange = visibleRange * zoomFactor;

    const newStart = cursorIndex - newRange * ratio;
    const newEnd = newStart + newRange;

    setXDomain(clampDomain(newStart, newEnd));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startDomain: xDomain,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - dragRef.current.startX;
    const [origStart, origEnd] = dragRef.current.startDomain;
    const visibleRange = origEnd - origStart;

    const pixelsPerIndex = rect.width / visibleRange;
    const indexShift = dx / pixelsPerIndex;

    const newStart = origStart - indexShift;
    const newEnd = origEnd - indexShift;

    setXDomain(clampDomain(newStart, newEnd));
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const handleDoubleClick = () => {
    setXDomain([0, data.length - 1]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      pinchRef.current = {
        distance: Math.abs(dx),
        domain: xDomain,
      };
    } else if (e.touches.length === 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startDomain: xDomain,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2 && pinchRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDistance = Math.abs(t1.clientX - t2.clientX);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;

      const ratio = midX / rect.width;
      const [origStart, origEnd] = pinchRef.current.domain;
      const visibleRange = origEnd - origStart;
      const centerIndex = origStart + visibleRange * ratio;

      const zoomFactor = pinchRef.current.distance / newDistance;
      const newRange = visibleRange * zoomFactor;

      const newStart = centerIndex - newRange * ratio;
      const newEnd = newStart + newRange;

      setXDomain(clampDomain(newStart, newEnd));
    } else if (e.touches.length === 1 && dragRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dx = e.touches[0].clientX - dragRef.current.startX;
      const [origStart, origEnd] = dragRef.current.startDomain;
      const visibleRange = origEnd - origStart;
      const pixelsPerIndex = rect.width / visibleRange;
      const indexShift = dx / pixelsPerIndex;

      const newStart = origStart - indexShift;
      const newEnd = origEnd - indexShift;

      setXDomain(clampDomain(newStart, newEnd));
    }
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  const isZoomed = xDomain[0] > 0 || xDomain[1] < data.length - 1;

  return (
    <div className="space-y-2">
      {/* Zoom controls bar */}
      <div className="flex items-center justify-between text-xs text-textMuted">
        <span>
          Showing: {xDomain[0]}s – {xDomain[1]}s
          {isZoomed && <span className="text-primary ml-2">(zoomed)</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline opacity-60">
            Scroll to zoom · Drag to pan · Double-click to reset
          </span>
          {isZoomed && (
            <button
              onClick={handleDoubleClick}
              className="px-2 py-1 bg-surface border border-border rounded text-xs font-semibold text-textMuted hover:text-textMain transition-colors"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Chart container with interaction handlers */}
      <div
        ref={containerRef}
        className="w-full h-[400px] cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none", overscrollBehavior: "contain" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="adminPastGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#1ED3A6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1ED3A6" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="adminFutureGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#8FA6A0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8FA6A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.1}
            />
            <XAxis
              dataKey="index"
              type="number"
              domain={xDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8FA6A0", fontSize: 10 }}
              minTickGap={60}
              tickFormatter={(i: number) => {
                if (i >= 3600)
                  return `${Math.floor(i / 3600)}h${Math.floor((i % 3600) / 60)}m`;
                if (i >= 60) return `${Math.floor(i / 60)}m${i % 60}s`;
                return `${i}s`;
              }}
              allowDataOverflow
            />
            <YAxis
              domain={["auto", "auto"]}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8FA6A0", fontSize: 11 }}
              tickFormatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18211E",
                borderColor: "#1F2A26",
                borderRadius: "8px",
                color: "#E6F1EE",
              }}
              itemStyle={{ color: "#1ED3A6" }}
              labelFormatter={(index: number) => {
                if (index >= 3600)
                  return `${Math.floor(index / 3600)}h ${Math.floor((index % 3600) / 60)}m ${index % 60}s`;
                if (index >= 60)
                  return `${Math.floor(index / 60)}m ${index % 60}s`;
                return `${index}s`;
              }}
              formatter={(value: number | undefined) =>
                value !== undefined
                  ? [`₹${value.toFixed(2)}`, "Price"]
                  : ["-", "Price"]
              }
            />

            {/* Past segment — solid green */}
            <Area
              type="monotone"
              dataKey="pastValue"
              stroke="#1ED3A6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#adminPastGradient)"
              connectNulls={false}
              dot={false}
              isAnimationActive={false}
            />

            {/* Future segment — dashed gray */}
            <Area
              type="monotone"
              dataKey="futureValue"
              stroke="#8FA6A0"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fillOpacity={1}
              fill="url(#adminFutureGradient)"
              connectNulls={false}
              dot={false}
              isAnimationActive={false}
            />

            {/* Current tick marker */}
            {currentTick > 0 && currentTick < data.length && (
              <ReferenceLine
                x={currentTick}
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: "NOW",
                  fill: "#F59E0B",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

```

## File: `components/admin/AdminLogin.tsx`

```tsx
import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../auth/AuthProvider';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const { signInAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Login directly with username and password
    const { error: err } = await signInAdmin(username, password);
    if (err) {
      setError(err);
      setIsLoading(false);
      return;
    }

    // Check if the user has admin role — done via AuthProvider
    // The App.tsx will check isAdmin and route accordingly
    setIsLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-textMain">Admin Panel</h2>
              <p className="text-xs text-textMuted">Restricted access — admin credentials required</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Username or Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                placeholder="Enter admin username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all pr-12"
                  placeholder="Admin password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm bg-negative/10 border border-negative/20 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Button type="submit" disabled={!username || !password || isLoading}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access Admin Panel
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

```

## File: `components/admin/AdminUsers.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Users, UserPlus, ArrowLeft, Trophy, Eye, EyeOff,
  TrendingUp, TrendingDown, Wallet, BarChart2, X,
  ChevronUp, ChevronDown, Loader2, AlertCircle, Check, Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { MarketItem } from '../../hooks/useMarket';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  cash_balance: number;
  starting_capital: number;
}

interface PortfolioRow {
  symbol: string;
  amount: number;
  avg_price: number;
}

interface TransactionRow {
  id: string;
  symbol: string;
  asset_name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchase_price: number | null;
  profit_loss: number | null;
  created_at: string;
}

interface RankedUser extends UserProfile {
  stockValue: number;
  netWorth: number;
  portfolio: PortfolioRow[];
}

interface AdminUsersProps {
  marketItems: MarketItem[];
}

const STARTING_CAPITAL = 100000;

// Works on HTTP dev and HTTPS prod (crypto.randomUUID requires HTTPS)
const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const formatINR = (v: number) =>
  '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/15 text-yellow-400 font-bold text-sm border border-yellow-500/30">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-400/10 text-zinc-300 font-bold text-sm border border-zinc-500/30">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/15 text-amber-500 font-bold text-sm border border-amber-700/30">3</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface text-textMuted font-semibold text-sm border border-border">{rank}</span>;
};

export const AdminUsers: React.FC<AdminUsersProps> = ({ marketItems }) => {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cleanup state
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; message: string } | null>(null);

  // Detail view
  const [selectedUser, setSelectedUser] = useState<RankedUser | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<'netWorth' | 'stockValue' | 'cash_balance'>('netWorth');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Use a ref for priceMap so fetchUsers doesn't re-run when prices update
  const priceMapRef = useRef<Record<string, number>>({});
  priceMapRef.current = React.useMemo(() => {
    const m: Record<string, number> = {};
    marketItems.forEach(item => { m[item.symbol] = item.price; });
    return m;
  }, [marketItems]);

  // fetchUsers ONLY depends on nothing — uses ref for current prices
  // This prevents auto-refresh whenever market prices tick
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, cash_balance, starting_capital')
        .eq('role', 'participant');
      if (pErr) throw pErr;

      const { data: portfolios, error: portErr } = await supabase
        .from('portfolios')
        .select('user_id, symbol, amount, avg_price');
      if (portErr) throw portErr;

      const portfolioByUser: Record<string, PortfolioRow[]> = {};
      (portfolios || []).forEach((row: any) => {
        if (!portfolioByUser[row.user_id]) portfolioByUser[row.user_id] = [];
        portfolioByUser[row.user_id].push(row);
      });

      const pm = priceMapRef.current;
      const ranked: RankedUser[] = (profiles || []).map((p: UserProfile) => {
        const holdings = portfolioByUser[p.id] || [];
        const stockValue = holdings.reduce((sum, h) => {
          return sum + h.amount * (pm[h.symbol] ?? h.avg_price);
        }, 0);
        return { ...p, stockValue, netWorth: stockValue + p.cash_balance, portfolio: holdings };
      });

      ranked.sort((a, b) => b.netWorth - a.netWorth);
      setUsers(ranked);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount only
  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddUser = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddError('Name, username and password are required');
      return;
    }
    
    if (!supabaseAdmin) {
      setAddError('Admin client not available. Please check VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables.');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      const username = newUsername.trim().toLowerCase();
      const email = `${username}@vsx.local`;
      
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (existingProfile) {
        setAddError('Username already taken');
        setAddLoading(false);
        return;
      }

      // Create auth user first using admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword.trim(),
        email_confirm: true,
        user_metadata: {
          username: username,
          display_name: newName.trim(),
          role: 'participant',
        }
      });

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
          setAddError('User already exists');
        } else {
          throw authError;
        }
        setAddLoading(false);
        return;
      }

      // The database trigger will create a profile, but we need to update it with password and balances
      // Wait a moment for trigger to execute, then update profile
      await new Promise(resolve => setTimeout(resolve, 100));

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          password: newPassword.trim(),
          cash_balance: STARTING_CAPITAL,
          starting_capital: STARTING_CAPITAL,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        // If update fails, try to create profile manually (in case trigger didn't fire)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username,
            display_name: newName.trim(),
            password: newPassword.trim(),
            role: 'participant',
            cash_balance: STARTING_CAPITAL,
            starting_capital: STARTING_CAPITAL,
          });

        if (insertError) {
          // Clean up auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw insertError;
        }
      }

      setAddSuccess(true);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddUser(false);
        fetchUsers();
      }, 1200);
    } catch (e: any) {
      setAddError(e.message?.includes('unique') ? 'Username already taken' : (e.message || 'Failed to create user'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (deleteConfirmId !== userId) {
      setDeleteConfirmId(userId);
      return;
    }

    setDeleteLoading(true);
    setError(null);
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin client not available. Please check VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables.');
      }

      // Delete portfolios and transactions first (use admin client to bypass RLS)
      await supabaseAdmin.from('portfolios').delete().eq('user_id', userId);
      await supabaseAdmin.from('transactions').delete().eq('user_id', userId);
      
      // Delete the auth user — this cascades to delete the profile too
      // (profiles.id references auth.users(id) on delete cascade)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        // If auth user doesn't exist (404), still try to clean up the profile row
        if (authError.status === 404) {
          const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
          if (profileError) throw profileError;
        } else {
          throw new Error(`Failed to delete user: ${authError.message}`);
        }
      }
      
      setDeleteConfirmId(null);
      if (selectedUser?.id === userId) setSelectedUser(null);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      setError(e.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectUser = async (u: RankedUser) => {
    setSelectedUser(u);
    setTxLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false });
    setTransactions((data as TransactionRow[]) || []);
    setTxLoading(false);
  };

  const handleCleanupOrphanedAuthUsers = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    setError(null);

    try {
      let authUserIds: Set<string> = new Set();
      let deletedAuthUsers = 0;
      let deletedProfiles = 0;
      let errorCount = 0;

      // Get all auth users if admin client is available
      if (supabaseAdmin) {
        try {
          const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
          if (authListError) {
            console.warn('Could not list auth users:', authListError.message);
          } else {
            authUserIds = new Set((authUsers?.users || []).map(u => u.id));
            
            // Find orphaned auth users (auth users without profiles)
            const { data: profiles } = await supabase.from('profiles').select('id');
            const profileIds = new Set((profiles || []).map(p => p.id));
            
            const orphanedAuthUsers = (authUsers?.users || []).filter(
              authUser => !profileIds.has(authUser.id)
            );

            // Delete orphaned auth users
            for (const user of orphanedAuthUsers) {
              try {
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                if (deleteError) {
                  console.error(`Failed to delete auth user ${user.id}:`, deleteError);
                  errorCount++;
                } else {
                  deletedAuthUsers++;
                }
                await new Promise(resolve => setTimeout(resolve, 50));
              } catch (err: any) {
                console.error(`Error deleting auth user ${user.id}:`, err);
                errorCount++;
              }
            }
          }
        } catch (err: any) {
          console.warn('Error accessing auth users:', err.message);
        }
      }

      // Get all profiles and find ones without auth users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');
      if (profilesError) throw profilesError;

      // Find orphaned profiles (profiles without auth users)
      // Only check if we have auth user list, otherwise skip
      if (authUserIds.size > 0) {
        const orphanedProfiles = (profiles || []).filter(
          profile => !authUserIds.has(profile.id)
        );

        // Delete orphaned profiles (these are the ones causing 404 errors)
        for (const profile of orphanedProfiles) {
          try {
            // Delete related data first
            await supabaseAdmin.from('portfolios').delete().eq('user_id', profile.id);
            await supabaseAdmin.from('transactions').delete().eq('user_id', profile.id);
            
            // Delete profile
            const { error: deleteError } = await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
            if (deleteError) {
              console.error(`Failed to delete profile ${profile.id}:`, deleteError);
              errorCount++;
            } else {
              deletedProfiles++;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err: any) {
            console.error(`Error deleting profile ${profile.id}:`, err);
            errorCount++;
          }
        }
      }

      const totalDeleted = deletedAuthUsers + deletedProfiles;
      if (totalDeleted === 0 && errorCount === 0) {
        setCleanupResult({ 
          deleted: 0, 
          message: supabaseAdmin 
            ? 'No orphaned users found. Database is clean!' 
            : 'Admin client not available. Could not check for orphaned users.' 
        });
      } else {
        const parts: string[] = [];
        if (deletedAuthUsers > 0) parts.push(`${deletedAuthUsers} orphaned auth users`);
        if (deletedProfiles > 0) parts.push(`${deletedProfiles} orphaned profiles`);
        
        setCleanupResult({
          deleted: totalDeleted,
          message: errorCount > 0
            ? `Cleaned up ${parts.join(' and ')}. ${errorCount} errors occurred.`
            : `Successfully cleaned up ${parts.join(' and ')}.`
        });
      }

      // Refresh user list
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to cleanup orphaned users');
    } finally {
      setCleanupLoading(false);
    }
  };

  const sortedUsers = React.useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return copy;
  }, [users, sortKey, sortDir]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-textMuted opacity-40 inline ml-1" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-primary inline ml-1" />
      : <ChevronUp className="w-3 h-3 text-primary inline ml-1" />;
  };

  // ─── Detail View ──────────────────────────────────────────────────────────
  if (selectedUser) {
    const rank = users.findIndex(u => u.id === selectedUser.id) + 1;
    const pm = priceMapRef.current;
    const plTotal = selectedUser.portfolio.reduce((sum, h) => {
      const curr = pm[h.symbol] ?? h.avg_price;
      return sum + (curr - h.avg_price) * h.amount;
    }, 0);

    return (
      <div className="space-y-6">
        {/* Detail header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textMuted" />
          </button>
          <RankBadge rank={rank} />
          <div>
            <h2 className="text-xl font-bold">{selectedUser.display_name}</h2>
            <p className="text-xs text-textMuted font-mono">@{selectedUser.username}</p>
          </div>
          {/* Delete from detail view */}
          <div className="ml-auto flex items-center gap-2">
            {deleteConfirmId === selectedUser.id && (
              <span className="text-xs text-negative">Confirm delete?</span>
            )}
            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              disabled={deleteLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                deleteConfirmId === selectedUser.id
                  ? 'bg-negative text-white border-negative'
                  : 'bg-negative/5 text-negative border-negative/30 hover:bg-negative/15'
              }`}
            >
              {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deleteConfirmId === selectedUser.id ? 'Yes, Delete' : 'Delete User'}
            </button>
            {deleteConfirmId === selectedUser.id && (
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs text-textMuted hover:text-textMain transition-colors px-2"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Stock Value', value: selectedUser.stockValue, icon: BarChart2, color: 'text-primary' },
            { label: 'Cash Balance', value: selectedUser.cash_balance, icon: Wallet, color: 'text-blue-400' },
            { label: 'Net Worth', value: selectedUser.netWorth, icon: Trophy, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-gradient-to-br from-surface to-surfaceElevated">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-textMuted">{label}</span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight">{formatINR(value)}</div>
            </Card>
          ))}
        </div>

        {/* Holdings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-textMuted" />
            <h3 className="font-semibold">Holdings</h3>
            {plTotal !== 0 && (
              <span className={`ml-auto text-sm font-semibold ${plTotal >= 0 ? 'text-primary' : 'text-negative'}`}>
                {plTotal >= 0 ? '+' : ''}{formatINR(plTotal)} P&L
              </span>
            )}
          </div>
          {selectedUser.portfolio.length === 0 ? (
            <p className="text-textMuted text-sm py-4 text-center">No holdings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Asset', 'Qty', 'Avg Buy', 'Current', 'P&L', 'Total Value'].map(h => (
                      <th key={h} className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider pb-3 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {selectedUser.portfolio.map(h => {
                    const curr = pm[h.symbol] ?? h.avg_price;
                    const pl = (curr - h.avg_price) * h.amount;
                    const totalVal = curr * h.amount;
                    const item = marketItems.find(m => m.symbol === h.symbol);
                    return (
                      <tr key={h.symbol} className="hover:bg-surfaceElevated/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {item?.icon || h.symbol[0]}
                            </div>
                            <div>
                              <div className="font-medium text-textMain">{item?.name || h.symbol}</div>
                              <div className="text-xs text-textMuted">{h.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-textMain">{h.amount}</td>
                        <td className="py-3 pr-4 font-mono text-textMuted">{formatINR(h.avg_price)}</td>
                        <td className="py-3 pr-4 font-mono text-textMain">{formatINR(curr)}</td>
                        <td className={`py-3 pr-4 font-mono font-semibold ${pl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pl >= 0 ? '+' : ''}{formatINR(pl)}
                        </td>
                        <td className="py-3 font-mono font-semibold text-textMain">{formatINR(totalVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Transactions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-textMuted" />
            <h3 className="font-semibold">Transaction History</h3>
          </div>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-textMuted text-sm py-4 text-center">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Type', 'Stock', 'Qty', 'Price', 'Buy Price', 'P&L', 'Time'].map(h => (
                      <th key={h} className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider pb-3 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-surfaceElevated/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          tx.type === 'BUY'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-negative/10 text-negative border border-negative/20'
                        }`}>
                          {tx.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-textMain">{tx.asset_name}</div>
                        <div className="text-xs text-textMuted">{tx.symbol}</div>
                      </td>
                      <td className="py-3 pr-4 font-mono">{tx.quantity}</td>
                      <td className="py-3 pr-4 font-mono">{formatINR(tx.price)}</td>
                      <td className="py-3 pr-4 font-mono text-textMuted">{tx.purchase_price != null ? formatINR(tx.purchase_price) : '—'}</td>
                      <td className={`py-3 pr-4 font-mono font-semibold ${tx.profit_loss == null ? 'text-textMuted' : tx.profit_loss >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profit_loss != null ? `${tx.profit_loss >= 0 ? '+' : ''}${formatINR(tx.profit_loss)}` : '—'}
                      </td>
                      <td className="py-3 text-xs text-textMuted whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Add User Panel */}
      {showAddUser && (
        <Card className="border border-primary/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">New Participant</h3>
            </div>
            <button onClick={() => { setShowAddUser(false); setAddError(null); setNewName(''); setNewUsername(''); setNewPassword(''); }}
              className="p-1.5 rounded-lg hover:bg-surfaceElevated transition-colors text-textMuted hover:text-textMain">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                placeholder="e.g. Team Alpha"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                placeholder="e.g. team_alpha"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-10 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm font-mono"
                />
                <button
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-negative text-sm mb-4 bg-negative/5 border border-negative/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {addError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddUser}
              disabled={addLoading || addSuccess}
              className="min-w-[120px]"
            >
              {addSuccess ? (
                <><Check className="w-4 h-4 mr-1" /> Created!</>
              ) : addLoading ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-1" /> Create User</>
              )}
            </Button>
            <p className="text-xs text-textMuted">Starts with ₹1,00,000 balance</p>
          </div>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Participants</h3>
            {!loading && (
              <span className="text-xs text-textMuted bg-surfaceElevated px-2 py-0.5 rounded-full border border-border">
                {users.length} total
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCleanupOrphanedAuthUsers}
              disabled={cleanupLoading}
              title="Remove orphaned auth users (users without profiles)"
            >
              {cleanupLoading ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Cleaning...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-1" /> Cleanup</>
              )}
            </Button>
            <Button
              variant={showAddUser ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => { setShowAddUser(s => !s); setAddError(null); }}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              {showAddUser ? 'Cancel' : 'Add User'}
            </Button>
          </div>
        </div>
        
        {cleanupResult && (
          <div className={`px-5 py-3 border-b border-border ${
            cleanupResult.deleted > 0 ? 'bg-primary/5' : 'bg-surfaceElevated'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {cleanupResult.deleted > 0 ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <AlertCircle className="w-4 h-4 text-textMuted" />
              )}
              <span className={cleanupResult.deleted > 0 ? 'text-primary' : 'text-textMuted'}>
                {cleanupResult.message}
              </span>
              <button
                onClick={() => setCleanupResult(null)}
                className="ml-auto text-textMuted hover:text-textMain transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-negative text-sm">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-textMuted opacity-30" />
            <p className="text-textMuted text-sm">No participants yet</p>
            <p className="text-xs text-textMuted opacity-60">Click "Add User" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surfaceElevated/30">
                  <th className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider px-5 py-3 w-14">Rank</th>
                  <th className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider px-4 py-3">Participant</th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('stockValue')}
                  >
                    <span className={sortKey === 'stockValue' ? 'text-primary' : 'text-textMuted'}>
                      Stock Value <SortIcon col="stockValue" />
                    </span>
                  </th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('cash_balance')}
                  >
                    <span className={sortKey === 'cash_balance' ? 'text-primary' : 'text-textMuted'}>
                      Cash <SortIcon col="cash_balance" />
                    </span>
                  </th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('netWorth')}
                  >
                    <span className={sortKey === 'netWorth' ? 'text-primary' : 'text-textMuted'}>
                      Net Worth <SortIcon col="netWorth" />
                    </span>
                  </th>
                  <th className="text-center text-xs text-textMuted font-semibold uppercase tracking-wider px-5 py-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sortedUsers.map((u) => {
                  const rank = users.indexOf(u) + 1;
                  const pl = u.netWorth - u.starting_capital;
                  const isConfirming = deleteConfirmId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surfaceElevated/40 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <RankBadge rank={rank} />
                      </td>
                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-primary border border-primary/20 flex-shrink-0">
                            {u.display_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-textMain group-hover:text-primary transition-colors">{u.display_name}</div>
                            <div className="text-xs text-textMuted font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-textMain cursor-pointer" onClick={() => handleSelectUser(u)}>{formatINR(u.stockValue)}</td>
                      <td className="px-4 py-4 text-right font-mono text-textMuted cursor-pointer" onClick={() => handleSelectUser(u)}>{formatINR(u.cash_balance)}</td>
                      <td className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSelectUser(u)}>
                        <div className="font-mono font-bold text-textMain">{formatINR(u.netWorth)}</div>
                        <div className={`text-xs font-semibold font-mono ${pl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pl >= 0 ? '+' : ''}{formatINR(pl)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isConfirming ? (
                            <>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteLoading}
                                className="px-2 py-1 bg-negative text-white rounded text-xs font-bold hover:bg-red-600 transition-colors"
                              >
                                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-textMuted hover:text-textMain rounded text-xs transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(u.id); }}
                              className="p-1.5 rounded-lg text-textMuted hover:text-negative hover:bg-negative/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

```

## File: `components/auth/AuthModal.tsx`

```tsx
import React, { useState } from 'react';
import { X, Mail, ArrowRight, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication delay
    setTimeout(() => {
      onLogin();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-textMain mb-2">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-textMuted text-sm">
            {isSignUp 
              ? 'Enter your details to get started with NovaTrade.' 
              : 'Enter your credentials to access your dashboard.'}
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8 space-y-4">
          {/* Google Button */}
          <button 
            onClick={() => onLogin()}
            className="w-full flex items-center justify-center gap-3 bg-surfaceElevated hover:bg-surfaceElevated/80 border border-border text-textMain font-medium py-2.5 rounded-lg transition-all duration-200 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-textMuted">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-textMuted uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surfaceElevated border border-border rounded-lg pl-10 pr-4 py-2.5 text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
               <div className="flex justify-between">
                <label className="text-xs font-medium text-textMuted uppercase">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-primary hover:text-secondary transition-colors">Forgot?</a>
                )}
               </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surfaceElevated border border-border rounded-lg px-4 py-2.5 text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <Button type="submit" className="w-full py-3">
              {isSignUp ? 'Create Account' : 'Log In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center text-sm text-textMuted pt-2">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-secondary font-medium transition-colors"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textMuted hover:text-textMain hover:bg-surfaceElevated rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
```

## File: `components/auth/AuthProvider.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'participant';
  cash_balance: number;
  starting_capital: number;
}

interface AuthContextValue {
  user: { id: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signInAdmin: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'vsx_user_id';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEY);
    if (savedUserId) {
      // Fetch profile by ID
      supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUserId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data as Profile);
            setUser({ id: data.id });
          } else {
            // Invalid saved session, clear it
            localStorage.removeItem(STORAGE_KEY);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Poll to refresh profile every 3 seconds (for balance updates after trades)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(prev => {
          // Only update if cash_balance changed
          if (prev?.cash_balance !== data.cash_balance) {
            return data as Profile;
          }
          return prev;
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (username: string, password: string) => {
    // Only allow participant accounts — admin cannot login via user login page
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .eq('role', 'participant')
      .single();

    if (error || !data) {
      return { error: 'Invalid username or password' };
    }

    // Save session
    setProfile(data as Profile);
    setUser({ id: data.id });
    localStorage.setItem(STORAGE_KEY, data.id);
    
    return { error: null };
  };

  const signInAdmin = async (username: string, password: string) => {
    // Admin-only login — participants cannot use this
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      return { error: 'Invalid admin credentials' };
    }

    setProfile(data as Profile);
    setUser({ id: data.id });
    localStorage.setItem(STORAGE_KEY, data.id);
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data as Profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signInAdmin,
        signOut,
        refreshProfile,
        isAdmin: profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

```

## File: `components/auth/UserLogin.tsx`

```tsx
/**
 * UserLogin Component
 *
 * Full-screen login page for regular (non-admin) users.
 * Features a cinematic Matrix-rain canvas animation on the background,
 * split-panel layout with branding on the left and a login form on the right.
 *
 * Props:
 *   - onOpenAdmin: callback to navigate to the Admin login page
 */

import React, { useState, useEffect, useRef } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "./AuthProvider";

// ---------- Types ----------

interface UserLoginProps {
  onOpenAdmin: () => void;
}

// ---------- Component ----------

export const UserLogin: React.FC<UserLoginProps> = ({ onOpenAdmin }) => {
  // Auth context — provides the signIn method
  const { signIn } = useAuth();

  // ---------- Local State ----------
  const [password, setPassword] = useState(""); // Password field value
  const [username, setUsername] = useState(""); // Username field value
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [error, setError] = useState(""); // Error message from auth
  const [isLoading, setIsLoading] = useState(false); // Loading spinner state
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for the Matrix rain <canvas>

  // ---------- Matrix Rain Background Effect ----------
  // Renders a falling-characters animation on a full-screen canvas.
  // Characters include currency symbols, alphanumerics, and Japanese katakana
  // for a cyberpunk / stock-market aesthetic.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Character set used for the rain drops
    const chars =
      "₹$%&@#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト▲▼◆►◄";
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    // Resize handler — recalculates column count & resets drop positions
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      // Start drops at random negative offsets so they stagger on load
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    };

    resize();
    window.addEventListener("resize", resize);

    // Core draw loop — called every animation frame
    const draw = () => {
      // Semi-transparent fill creates the fading trail effect
      ctx.fillStyle = "rgba(10, 14, 20, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        // Pick a random character from the set
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary brightness randomly for a flickering glow effect
        const brightness = Math.random();
        if (brightness > 0.95) {
          // Rare bright white flash — "lead" character
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "#1ED3A6";
          ctx.shadowBlur = 20;
        } else if (brightness > 0.7) {
          // Bright primary green
          ctx.fillStyle = "#1ED3A6";
          ctx.shadowColor = "#1ED3A6";
          ctx.shadowBlur = 10;
        } else if (brightness > 0.3) {
          // Medium opacity green
          ctx.fillStyle = `rgba(30, 211, 166, ${0.3 + brightness * 0.3})`;
          ctx.shadowBlur = 0;
        } else {
          // Faint, nearly invisible green — background depth
          ctx.fillStyle = `rgba(30, 211, 166, ${0.05 + brightness * 0.15})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0; // Reset shadow after each character

        // Reset drop to top once it falls past the viewport (with randomness)
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        // Advance drop position — variable speed for organic feel
        drops[i] += 0.4 + Math.random() * 0.6;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup — cancel animation loop and remove resize listener on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ---------- Form Submission Handler ----------
  // Authenticates the user via Supabase through the AuthProvider signIn method.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: err } = await signIn(username, password);
    if (err) {
      setError(err);
    }
    setIsLoading(false);
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* ===== Background Layer ===== */}
      {/* Full-screen canvas for the Matrix rain animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0.8 }}
      />
      {/* Gradient overlay to soften the canvas and improve text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/40 via-transparent to-background/70" />

      {/* ===== Sponsor Logos (top corners) ===== */}
      {/* Tech Fest logo — top left */}
      <img
        src="/techfest-logo.png"
        alt="Tech Fest"
        className="absolute top-12 left-12 h-9 z-20 drop-shadow-lg"
      />
      {/* Vedam School of Technology logo — top right */}
      <img
        src="/vedam-logo.png"
        alt="Vedam School of Technology"
        className="absolute top-11 right-12 h-8 z-20 drop-shadow-lg"
      />

      {/* ===== Left Panel — Branding & Info (visible on large screens only) ===== */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="max-w-md text-center space-y-6 px-12">
          {/* Main VSX logo */}
          <img
            src="/vsx-logo.png"
            alt="VSX: Buy or Bail"
            className="h-56 mx-auto drop-shadow-2xl"
          />
          {/* Tagline */}
          <p className="text-lg text-textMuted leading-relaxed">
            Compete with 40 players in the ultimate stock trading showdown.
            Start with ₹1 Lakh — buy smart or bail fast.
          </p>

          {/* Quick stats — Players, Stocks, Starting Capital */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">40</div>
              <div className="text-xs text-textMuted mt-1">Players</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-textMuted mt-1">Stocks</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">₹1L</div>
              <div className="text-xs text-textMuted mt-1">
                Starting Capital
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* ===== Right Panel — Login Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile-only header (hidden on desktop where the left panel shows branding) */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">
              VSX: <span className="text-primary">Buy or Bail</span>
            </h1>
          </div>

          {/* Login Card */}
          <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-black/20">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-textMain mb-2">
                Welcome!
              </h2>
              <p className="text-sm text-textMuted">
                Enter your credentials to access the trading floor
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password Input with show/hide toggle */}
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {/* Eye icon toggle for password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Banner — shown when authentication fails */}
              {error && (
                <div className="flex items-center gap-2 text-negative text-sm bg-negative/10 border border-negative/20 px-4 py-3 rounded-xl">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button — disabled while loading or if fields are empty */}
              <Button
                type="submit"
                disabled={!username || !password || isLoading}
                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Admin Access Link — navigates to the separate Admin login page */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <button
                onClick={onOpenAdmin}
                className="w-full text-center text-xs text-textMuted hover:text-primary transition-colors py-2"
              >
                Admin Access →
              </button>
            </div>
          </div>

          {/* Footer tagline */}
          <p className="text-center text-xs text-textMuted/50 mt-6">
            VSX: Buy or Bail • 40 Players • Real-time Simulation
          </p>
        </div>
      </div>
    </div>
  );
};

```

## File: `components/dashboard/Charts.tsx`

```tsx
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { StockDataPoint } from '../../types';

interface MainChartProps {
  data: StockDataPoint[];
}

export const MainChart: React.FC<MainChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1ED3A6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#1ED3A6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8FA6A0', fontSize: 12 }} 
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8FA6A0', fontSize: 12 }}
            tickFormatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18211E', borderColor: '#1F2A26', borderRadius: '8px', color: '#E6F1EE' }}
            itemStyle={{ color: '#1ED3A6' }}
            formatter={(value: number) => [`₹${(value ?? 0).toFixed(2)}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#1ED3A6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Upgraded graphical sparkline (filled area instead of plain line)
interface MiniSparklineProps {
  data: { value: number; time?: string }[];
  color?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ data, color = '#1ED3A6' }) => {
  const gradientId = React.useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  // Compute tight Y-axis domain to exaggerate price movement visibility
  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  // Add 20% padding so the line doesn't touch edges; if range is 0, use ±1% of price
  const padding = range > 0 ? range * 0.2 : minVal * 0.01;
  const yDomain: [number, number] = [minVal - padding, maxVal + padding];

  return (
    <div className="w-full h-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <YAxis domain={yDomain} hide />
          <Area 
            type="natural" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Keep old MiniChart for backward compat
interface MiniChartProps {
  data: { value: number }[];
  color?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, color = '#1ED3A6' }) => {
  return <MiniSparkline data={data} color={color} />;
};

interface SentimentChartProps {
  data: { name: string; value: number; color: string }[];
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[200px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-textMain">53%</span>
        <span className="text-xs text-textMuted uppercase tracking-wider">Bullish</span>
      </div>
    </div>
  );
};

// Full stock chart with volume bars
interface StockChartProps {
  data: StockDataPoint[];
  color?: string;
}

export const StockChart: React.FC<StockChartProps> = ({ data, color = '#1ED3A6' }) => {
  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const chartColor = isPositive ? '#1ED3A6' : '#EF4444';

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8FA6A0', fontSize: 10 }}
            minTickGap={50}
          />
          <YAxis
            domain={['auto', 'auto']}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8FA6A0', fontSize: 11 }}
            tickFormatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18211E', borderColor: '#1F2A26', borderRadius: '8px', color: '#E6F1EE' }}
            itemStyle={{ color: chartColor }}
            formatter={(value: number) => [`₹${(value ?? 0).toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#stockGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## File: `components/dashboard/DashboardLayout.tsx`

```tsx
import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Sidebar } from "./Sidebar";
import { Card } from "../ui/Card";
import { MainChart, MiniSparkline, SentimentChart } from "./Charts";
import { METRICS, SENTIMENT_DATA, generateChartData } from "../../constants";
import {
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  LogIn,
  LogOut as LogOutIcon,
  User as UserIcon,
  History,
  TrendingUp,
  TrendingDown,
  Zap,
  Trophy,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "../ui/Button";
import { TradeModal } from "./TradeModal";

// Lazy-load stock detail chart (contains Recharts)
const StockDetailChart = lazy(() =>
  import("./StockDetailChart").then((m) => ({ default: m.StockDetailChart })),
);
import type { Profile } from "../auth/AuthProvider";
import type { MarketItem } from "../../hooks/useMarket";
import type { NewsEvent } from "../../hooks/useNews";
import type { PortfolioItem, Transaction } from "../../hooks/usePortfolio";

// Map company symbols to their logo filenames in /public
const COMPANY_LOGOS: Record<string, string> = {
  VELOCITY: "/VelocityAuto.png",
  APEXAUTO: "/ApexAutomotive.png",
  CRUISER: "/CruiserDynamics.png",
  VITALIS: "/VitalisHealth.png",
  CAREPLUS: "/CarePlus.png",
  MEDISURG: "/Medisurge Pharma.png",
  EDUNEXT: "/EduNext.png",
  SCHOLAR: "/ScholarStream.png",
  BRAINB: "/BrainBoost.png",
  FRESHC: "/FreshCrave Foods.png",
  SPICER: "/SpiceRoute Dining.png",
  URBANB: "/UrbanBites.png",
};

interface DashboardLayoutProps {
  profile: Profile;
  marketItems: MarketItem[];
  newsEvents: NewsEvent[];
  portfolio: PortfolioItem[];
  transactions: Transaction[];
  onExecuteTrade: (
    userId: string,
    symbol: string,
    assetName: string,
    type: "BUY" | "SELL",
    quantity: number,
    price: number,
    currentBalance: number,
    purchasePrice?: number,
  ) => Promise<{ error: string | null }>;
  onLogout: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  onRefreshProfile: () => Promise<void>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  profile,
  marketItems,
  newsEvents,
  portfolio,
  transactions,
  onExecuteTrade,
  onLogout,
  onOpenAdmin,
  isAdmin,
  onRefreshProfile,
}) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketItem | null>(null);
  const [selectedStock, setSelectedStock] = useState<MarketItem | null>(null);
  const [newsToast, setNewsToast] = useState<NewsEvent | null>(null);

  // Track previous news event count to detect new flashes
  const prevNewsCountRef = useRef(newsEvents.length);

  useEffect(() => {
    if (newsEvents.length > prevNewsCountRef.current) {
      // A new flash was triggered — show toast
      const newest = newsEvents[0];
      if (newest && newest.active) {
        setNewsToast(newest);
        const timer = setTimeout(() => setNewsToast(null), 8000);
        return () => clearTimeout(timer);
      }
    }
    prevNewsCountRef.current = newsEvents.length;
  }, [newsEvents]);

  const balance = profile.cash_balance ?? 0;
  const startingCapital = profile.starting_capital ?? 100000;

  const handleOpenTrade = (asset: MarketItem) => {
    setSelectedAsset(asset);
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = async (type: "buy" | "sell", quantity: number) => {
    if (!selectedAsset) return;

    const existing = portfolio.find((p) => p.symbol === selectedAsset.symbol);
    const result = await onExecuteTrade(
      profile.id,
      selectedAsset.symbol,
      selectedAsset.name,
      type === "buy" ? "BUY" : "SELL",
      quantity,
      selectedAsset.price,
      balance,
      existing?.avg_price,
    );

    if (!result.error) {
      setTradeModalOpen(false);
      // Refresh profile to update cash balance
      await onRefreshProfile();
    }
  };

  // Portfolio value
  const totalPortfolioValueCalc = portfolio.reduce((acc, item) => {
    const currentPrice =
      marketItems.find((m) => m.symbol === item.symbol)?.price ?? 0;
    return acc + (item.amount ?? 0) * currentPrice;
  }, 0);

  // If viewing a stock detail chart, look up the LIVE version from marketItems
  // so it updates in real-time (instead of using the stale snapshot)
  const liveSelectedStock = selectedStock
    ? (marketItems.find((m) => m.symbol === selectedStock.symbol) ??
      selectedStock)
    : null;

  if (liveSelectedStock) {
    return (
      <div className="flex min-h-screen bg-background text-textMain">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedStock(null);
            setActiveTab(tab);
          }}
          onOpenAdmin={onOpenAdmin}
          currentUserName={profile.display_name}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
          <Suspense
            fallback={
              <div className="text-textMuted text-center py-10 animate-pulse">
                Loading chart...
              </div>
            }
          >
            <StockDetailChart
              stock={liveSelectedStock}
              onBack={() => setSelectedStock(null)}
              ownedQty={
                portfolio.find((p) => p.symbol === liveSelectedStock.symbol)
                  ?.amount || 0
              }
              avgPrice={
                portfolio.find((p) => p.symbol === liveSelectedStock.symbol)
                  ?.avg_price || 0
              }
              onTrade={() => handleOpenTrade(liveSelectedStock)}
            />
          </Suspense>
        </main>
        {tradeModalOpen && (
          <TradeModal
            isOpen={tradeModalOpen}
            onClose={() => setTradeModalOpen(false)}
            asset={selectedAsset}
            balance={balance}
            onConfirm={handleConfirmTrade}
            ownedQuantity={
              portfolio.find((p) => p.symbol === selectedAsset?.symbol)
                ?.amount || 0
            }
            transactions={transactions.filter(
              (t) => t.symbol === selectedAsset?.symbol,
            )}
          />
        )}
      </div>
    );
  }

  const renderOverview = () => {
    const totalPortfolioValue = portfolio.reduce((acc, item) => {
      const currentPrice =
        marketItems.find((m) => m.symbol === item.symbol)?.price ?? 0;
      return acc + (item.amount ?? 0) * currentPrice;
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    return (
      <>
        {/* Balance Header */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <span className="text-sm text-textMuted block mb-1">
              Total Net Worth
            </span>
            <span className="text-4xl md:text-6xl font-bold text-textMain">
              ₹
              {totalNetWorth.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <h3 className="text-sm text-textMuted mb-1">Stock Value</h3>
            <div className="text-2xl font-bold font-mono">
              ₹
              {totalPortfolioValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <h3 className="text-sm text-textMuted mb-1">P&L</h3>
            <div
              className={`text-2xl font-bold font-mono ${totalNetWorth - startingCapital >= 0 ? "text-primary" : "text-negative"}`}
            >
              {totalNetWorth - startingCapital >= 0 ? "+" : ""}₹
              {(totalNetWorth - startingCapital).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
          </Card>
        </div>

        {/* Market Snapshot - All Companies as Cards */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Market Snapshot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {marketItems.map((item) => (
              <Card
                key={item.symbol}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => setSelectedStock(item)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center overflow-hidden">
                    <img
                      src={COMPANY_LOGOS[item.symbol] || ""}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-textMain">
                      {item.name}
                    </div>
                    <div className="text-xs text-textMuted">{item.symbol}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono font-bold text-lg">
                    ₹
                    {(item.price ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${(item.change ?? 0) >= 0 ? "text-primary" : "text-negative"}`}
                  >
                    {" "}
                    {(item.change ?? 0) >= 0 ? "+" : ""}
                    {(item.change ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div
                  style={{
                    background: "#222",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    padding: "2px",
                  }}
                >
                  <MiniSparkline
                    data={
                      item.priceHistory && item.priceHistory.length > 0
                        ? item.priceHistory.slice(-20)
                        : [
                            { value: item.price ?? 0 },
                            { value: item.price ?? 0 },
                            { value: item.price ?? 0 },
                          ]
                    }
                    color={(item.change ?? 0) >= 0 ? "#1ED3A6" : "#EF4444"}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderMarkets = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
          <h3 className="text-sm text-textMuted mb-2">Market Status</h3>
          <div className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />{" "}
            Live
          </div>
          <div className="text-primary text-sm flex items-center gap-1">
            Prices update every 5s
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
          <h3 className="text-sm text-textMuted mb-2">Your Purchasing Power</h3>
          <div className="text-2xl font-bold mb-1 font-mono">
            ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-textMuted text-sm flex items-center gap-1">
            Available to trade
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
          <h3 className="text-sm text-textMuted mb-2">Total Stocks</h3>
          <div className="text-2xl font-bold mb-1">{marketItems.length}</div>
          <div className="text-primary text-sm flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Active
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Live Market Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                <th className="pb-3 pl-2">Company</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Change</th>
                <th className="pb-3">Your Avg Price</th>
                <th className="pb-3">Trend</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {marketItems.map((item) => {
                const owned = portfolio.find((p) => p.symbol === item.symbol);
                return (
                  <tr
                    key={item.symbol}
                    className="border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors group"
                  >
                    <td className="py-4 pl-2">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setSelectedStock(item)}
                      >
                        <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                          <img
                            src={COMPANY_LOGOS[item.symbol] || ""}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-textMain">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium text-textMuted">
                              {item.symbol}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surfaceElevated border border-border text-textMuted">
                              {item.sector}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-medium">
                      ₹
                      {(item.price ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-4">
                      <span
                        className={`flex items-center gap-1 ${(item.change ?? 0) >= 0 ? "text-primary" : "text-negative"}`}
                      >
                        {(item.change ?? 0) >= 0 ? "+" : ""}
                        {(item.change ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 font-mono text-textMuted">
                      {owned
                        ? `₹${(owned.avg_price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-4 w-32">
                      <MiniSparkline
                        data={(item.priceHistory || []).slice(-20)}
                        color={item.change >= 0 ? "#1ED3A6" : "#EF4444"}
                      />
                    </td>
                    <td className="py-4">
                      <Button
                        size="sm"
                        onClick={() => handleOpenTrade(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPortfolio = () => {
    const totalPortfolioValue = portfolio.reduce((acc, item) => {
      const currentPrice =
        marketItems.find((m) => m.symbol === item.symbol)?.price ?? 0;
      return acc + (item.amount ?? 0) * currentPrice;
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Card className="md:col-span-2 bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex flex-col justify-between h-full">
              <div style={{ marginLeft: "1em" }}>
                <h3 className="text-sm text-textMuted mb-1">Total Net Worth</h3>
                <div className="text-5xl font-bold mb-4 font-mono">
                  ₹
                  {totalNetWorth.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-3 max-w-xs">
                <div className="px-4 py-2 bg-surface/50 rounded-lg border border-border">
                  <span className="text-xs text-textMuted block mb-0.5">
                    Stock Value
                  </span>
                  <span className="font-mono font-semibold">
                    ₹
                    {totalPortfolioValue.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="px-4 py-2 bg-surface/50 rounded-lg border border-border">
                  <span className="text-xs text-textMuted block mb-0.5">
                    Cash Balance
                  </span>
                  <span className="font-mono font-semibold">
                    ₹
                    {balance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold mb-2">Allocation</h3>
            <div className="h-[200px]">
              {portfolio.length > 0 ? (
                <SentimentChart
                  data={portfolio.map((i, idx) => ({
                    name: i.symbol,
                    value:
                      (i.amount ?? 0) *
                      (marketItems.find((m) => m.symbol === i.symbol)?.price ??
                        0),
                    color: [
                      "#1ED3A6",
                      "#14B8A6",
                      "#0D9488",
                      "#0F766E",
                      "#10B981",
                      "#34D399",
                    ][idx % 6],
                  }))}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-textMuted text-xs">
                  No assets owned
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Your Holdings</h3>
          {portfolio.length === 0 ? (
            <div className="text-center py-12 text-textMuted">
              <p className="mb-4">You don't own any stocks yet.</p>
              <Button onClick={() => setActiveTab("Markets")}>
                Go to Markets
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-textMuted text-xs uppercase border-b border-border">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Avg Buy Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">Total Value</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {portfolio.map((item) => {
                    const marketData = marketItems.find(
                      (m) => m.symbol === item.symbol,
                    );
                    const currentPrice = marketData?.price ?? 0;
                    const amount = item.amount ?? 0;
                    const avgPrice = item.avg_price ?? 0;
                    const totalValue = amount * currentPrice;
                    const pnl = (currentPrice - avgPrice) * amount;
                    return (
                      <tr
                        key={item.symbol}
                        className="border-b border-border/50"
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center overflow-hidden">
                              <img
                                src={COMPANY_LOGOS[item.symbol] || ""}
                                alt={item.symbol}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-textMain">
                                {marketItems.find(
                                  (m) => m.symbol === item.symbol,
                                )?.name || item.symbol}
                              </div>
                              <div className="text-xs text-textMuted">
                                {item.symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono">{amount.toFixed(2)}</td>
                        <td className="py-4 font-mono text-textMuted">
                          ₹
                          {avgPrice.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 font-mono">
                          ₹
                          {currentPrice.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`py-4 font-mono font-bold ${pnl >= 0 ? "text-primary" : "text-negative"}`}
                        >
                          {pnl >= 0 ? "+" : ""}₹
                          {pnl.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 font-bold font-mono text-textMain">
                          ₹
                          {totalValue.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenTrade(marketData!)}
                          >
                            Trade
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-textMuted text-xs uppercase border-b border-border">
                    <th className="pb-3 pl-2">Type</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Buy Price</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3 text-right pr-2">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.slice(0, 20).map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50">
                      <td className="py-3 pl-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${tx.type === "BUY" ? "bg-primary/20 text-primary" : "bg-negative/20 text-negative"}`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">{tx.symbol}</td>
                      <td className="py-3 font-mono">
                        {(tx.quantity ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 font-mono">
                        ₹
                        {(tx.price ?? 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 font-mono text-textMuted">
                        {tx.purchase_price != null
                          ? `₹${tx.purchase_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td
                        className={`py-3 font-mono font-bold ${(tx.profit_loss ?? 0) >= 0 ? "text-primary" : "text-negative"}`}
                      >
                        {tx.profit_loss != null
                          ? `${tx.profit_loss >= 0 ? "+" : ""}₹${tx.profit_loss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 text-right pr-2 text-textMuted text-xs">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderNewsEvents = () => {
    const activeEvent = newsEvents.find((e) => e.active);
    const pastEvents = newsEvents.filter((e) => !e.active);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Market News</h2>
            <p className="text-textMuted text-sm">
              Breaking stories & events shaping the market
            </p>
          </div>
        </div>

        {/* Active Flash — Featured Blog Post */}
        {activeEvent &&
          (() => {
            const crashCompany = marketItems.find(
              (m) => m.symbol === activeEvent.crash_company,
            );
            return (
              <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-surface to-red-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                    <span className="flex items-center gap-1 text-xs text-textMuted">
                      <Clock className="w-3 h-3" />
                      {new Date(activeEvent.created_at).toLocaleString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        },
                      )}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-orange-400 mb-3 leading-tight">
                    {activeEvent.headline}
                  </h2>
                  <p className="text-sm text-textMuted mb-5 leading-relaxed max-w-2xl">
                    Markets are reacting to breaking developments.{" "}
                    {crashCompany?.name || activeEvent.crash_company} shares
                    have plummeted by {Math.abs(activeEvent.crash_percent)}% as
                    investors rush to exit positions.
                    {activeEvent.boost_companies.length > 0 &&
                      ` Meanwhile, competitors are seeing gains as capital flows into alternative stocks.`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-negative/5 rounded-xl border border-negative/20">
                      <div className="w-10 h-10 rounded-lg bg-negative/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-negative" />
                      </div>
                      <div>
                        <div className="text-xs text-textMuted">Crashing</div>
                        <div className="font-bold text-negative">
                          {crashCompany?.name || activeEvent.crash_company}
                        </div>
                        <div className="text-xs font-mono text-negative">
                          {activeEvent.crash_percent}%
                        </div>
                      </div>
                    </div>
                    {activeEvent.boost_companies.map((sym) => {
                      const company = marketItems.find((m) => m.symbol === sym);
                      return (
                        <div
                          key={sym}
                          className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-textMuted">
                              Benefiting
                            </div>
                            <div className="font-bold text-primary">
                              {company?.name || sym}
                            </div>
                            <div className="text-xs font-mono text-primary">
                              +{activeEvent.boost_percent}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Past Events — Blog Cards */}
        {pastEvents.length === 0 && !activeEvent ? (
          <Card className="text-center py-16">
            <Newspaper className="w-12 h-12 mx-auto text-textMuted mb-4 opacity-30" />
            <h3 className="text-xl font-bold mb-2">No News Yet</h3>
            <p className="text-textMuted">
              Market-moving events will appear here when triggered by the admin.
            </p>
          </Card>
        ) : (
          pastEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">
                Previous Stories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastEvents.map((event) => {
                  const crashCompany = marketItems.find(
                    (m) => m.symbol === event.crash_company,
                  );
                  return (
                    <Card
                      key={event.id}
                      className="hover:border-border transition-colors"
                      hoverEffect
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <span className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">
                          Market Alert
                        </span>
                        <span className="text-[10px] text-textMuted ml-auto">
                          {new Date(event.created_at).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-textMain text-sm mb-2 leading-snug">
                        {event.headline}
                      </h4>
                      <p className="text-xs text-textMuted mb-3 line-clamp-2">
                        {crashCompany?.name || event.crash_company} dropped{" "}
                        {Math.abs(event.crash_percent)}%.
                        {event.boost_companies.length > 0 &&
                          ` ${event.boost_companies.length} competitor(s) rose +${event.boost_percent}%.`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded text-[10px] font-bold">
                          <TrendingDown className="w-2.5 h-2.5" />
                          {crashCompany?.name || event.crash_company}{" "}
                          {event.crash_percent}%
                        </span>
                        {event.boost_companies.slice(0, 2).map((sym) => {
                          const company = marketItems.find(
                            (m) => m.symbol === sym,
                          );
                          return (
                            <span
                              key={sym}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold"
                            >
                              <TrendingUp className="w-2.5 h-2.5" />
                              {company?.name || sym} +{event.boost_percent}%
                            </span>
                          );
                        })}
                        {event.boost_companies.length > 2 && (
                          <span className="text-[10px] text-textMuted">
                            Active for{" "}
                            {Math.round(
                              (Date.now() -
                                new Date(event.created_at || 0).getTime()) /
                                60000,
                            )}{" "}
                            min
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-textMain">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={onOpenAdmin}
        currentUserName={profile.display_name}
      />

      {tradeModalOpen && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          asset={selectedAsset}
          balance={balance}
          onConfirm={handleConfirmTrade}
          ownedQuantity={
            portfolio.find((p) => p.symbol === selectedAsset?.symbol)?.amount ||
            0
          }
          transactions={transactions.filter(
            (t) => t.symbol === selectedAsset?.symbol,
          )}
        />
      )}

      {/* News Flash Toast Notification */}
      {newsToast &&
        (() => {
          const crashCompany = marketItems.find(
            (m) => m.symbol === newsToast.crash_company,
          );
          return (
            <div
              className="fixed top-4 right-4 z-[100] w-96 max-w-[calc(100vw-2rem)]"
              style={{ animation: "slideInRight 0.4s ease-out" }}
            >
              <style>{`@keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
              <div className="bg-surface border border-orange-500/40 rounded-xl shadow-2xl shadow-orange-500/10 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Breaking
                      </span>
                    </div>
                    <button
                      onClick={() => setNewsToast(null)}
                      className="text-textMuted hover:text-textMain flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-orange-400 text-sm mb-2">
                    {newsToast.headline}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded text-[10px] font-bold">
                      <TrendingDown className="w-2.5 h-2.5" />
                      {crashCompany?.name || newsToast.crash_company}{" "}
                      {newsToast.crash_percent}%
                    </span>
                    {newsToast.boost_companies.slice(0, 2).map((sym) => {
                      const company = marketItems.find((m) => m.symbol === sym);
                      return (
                        <span
                          key={sym}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold"
                        >
                          <TrendingUp className="w-2.5 h-2.5" />
                          {company?.name || sym} +{newsToast.boost_percent}%
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setNewsToast(null);
                      setActiveTab("News Events");
                    }}
                    className="mt-3 w-full py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
                  >
                    View Full Story →
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center text-sm font-bold text-primary">
                {profile.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-textMain leading-none">
                  {profile.display_name}
                </h1>
                <span className="text-xs md:text-sm text-textMuted">
                  @{profile.username}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <>
              <div className="flex items-center gap-2 bg-surfaceElevated px-3 py-1 rounded-lg border border-border">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono">
                  ₹
                  {balance.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOutIcon className="w-4 h-4 mr-1" /> Logout
              </Button>
            </>
          </div>
        </header>

        {/* Breaking News Banner — visible on all tabs when a flash is active */}
        {(() => {
          const activeEvent = newsEvents.find((e) => e.active);
          if (!activeEvent) return null;
          const crashCompany = marketItems.find(
            (m) => m.symbol === activeEvent.crash_company,
          );
          return (
            <div className="mb-6 relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-orange-500/10">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse" />
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                  <span className="text-xs text-textMuted">Breaking News</span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-orange-400 mb-2">
                  {activeEvent.headline}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-negative/10 text-negative rounded-lg text-xs font-semibold">
                    <TrendingDown className="w-3 h-3" />
                    {crashCompany?.name || activeEvent.crash_company}{" "}
                    {activeEvent.crash_percent}%
                  </span>
                  {activeEvent.boost_companies.map((sym) => {
                    const company = marketItems.find((m) => m.symbol === sym);
                    return (
                      <span
                        key={sym}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {company?.name || sym} +{activeEvent.boost_percent}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">{renderOverview()}</div>
            <div className="space-y-6">
              {/* Sentiment Gauge */}
              <Card>
                <h3 className="text-sm font-semibold mb-2">Market Sentiment</h3>
                <SentimentChart data={SENTIMENT_DATA} />
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  {SENTIMENT_DATA.map((item) => (
                    <div key={item.name}>
                      <div
                        className="text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        {item.value}%
                      </div>
                      <div className="text-[10px] text-textMuted">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent News */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Recent News</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("News Events")}
                  >
                    View All
                  </Button>
                </div>
                {newsEvents.length === 0 ? (
                  <div className="text-center py-4 text-textMuted text-xs">
                    No news events yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {newsEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 py-2 px-2 rounded-lg bg-surfaceElevated/50"
                      >
                        <Zap className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-textMain truncate">
                            {event.headline}
                          </div>
                          <div className="text-[10px] text-textMuted">
                            {new Date(event.created_at).toLocaleString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "Markets" && renderMarkets()}
        {activeTab === "Portfolio" && renderPortfolio()}
        {activeTab === "News Events" && renderNewsEvents()}
      </main>
    </div>
  );
};

```

## File: `components/dashboard/MarketConfigModal.tsx`

```tsx
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { MarketItem } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface MarketConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItems: MarketItem[];
  onSave: (items: MarketItem[]) => void;
}

export const MarketConfigModal: React.FC<MarketConfigModalProps> = ({
  isOpen,
  onClose,
  currentItems,
  onSave,
}) => {
  const [items, setItems] = useState<MarketItem[]>(currentItems);

  useEffect(() => {
    setItems(currentItems);
  }, [currentItems, isOpen]);

  const handleChange = (index: number, field: keyof MarketItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setItems([
      ...items,
      {
        name: "New Company",
        symbol: "NEW",
        price: 100,
        change: 0,
        sentiment: "Neutral",
        icon: "N",
      },
    ]);
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card
        className="w-full max-w-3xl max-h-[90vh] flex flex-col p-6"
        padding="none"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-textMain">
            Manage Market Companies
          </h2>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-textMain"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-end bg-surfaceElevated/50 p-4 rounded-lg"
            >
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  value={item.symbol}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 5);
                    handleChange(index, "symbol", val);
                    if (val.length > 0) handleChange(index, "icon", val[0]);
                  }}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Initial Price ($)
                </label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleChange(
                      index,
                      "price",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Sentiment
                </label>
                <select
                  value={item.sentiment}
                  onChange={(e) =>
                    handleChange(index, "sentiment", e.target.value)
                  }
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none text-sm"
                >
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
              <div className="col-span-6 md:col-span-1 flex justify-end">
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 text-negative hover:bg-negative/10 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <Button
            variant="secondary"
            onClick={handleAdd}
            className="w-full border-dashed border-2 border-border hover:border-primary bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Company
          </Button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
};

```

## File: `components/dashboard/Sidebar.tsx`

```tsx
import React from "react";
import {
  LayoutDashboard,
  LineChart,
  Wallet,
  Newspaper,
  Shield,
  Search,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
  currentUserName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  currentUserName,
}) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: LineChart, label: "Markets" },
    { icon: Wallet, label: "Portfolio" },
    { icon: Newspaper, label: "News Events" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen sticky top-0 border-r border-border bg-background pt-6 pb-4 transition-all duration-300">
      <div className="px-3 mb-10 flex items-center justify-center lg:justify-start gap-2">
        <img src="/vsx-logo.png" alt="VSX" className="h-14 flex-shrink-0" />
        <span className="text-xs font-bold tracking-wider text-primary hidden lg:block uppercase">
          VSX
        </span>
      </div>

      <div className="px-4 mb-6 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group focus:outline-none ${
              activeTab === item.label
                ? "bg-surfaceElevated text-primary"
                : "text-textMuted hover:text-textMain hover:bg-surface/50"
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${activeTab === item.label ? "text-primary" : "text-textMuted group-hover:text-textMain"}`}
            />
            <span className="font-medium hidden lg:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 mt-auto space-y-1 border-t border-border pt-4">
        {currentUserName && (
          <div className="px-3 py-2 mb-2 hidden lg:block">
            <span className="text-xs text-textMuted block">Logged in as</span>
            <span className="text-sm font-semibold text-textMain truncate block">
              {currentUserName}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};

```

## File: `components/dashboard/StockDetailChart.tsx`

```tsx
import React, { useState, useMemo } from "react";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { MarketItem } from "../../types";
import { StockChart } from "./Charts";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const COMPANY_LOGOS: Record<string, string> = {
  VELOCITY: "/VelocityAuto.png",
  APEXAUTO: "/ApexAutomotive.png",
  CRUISER: "/CruiserDynamics.png",
  VITALIS: "/VitalisHealth.png",
  CAREPLUS: "/CarePlus.png",
  MEDISURG: "/Medisurge Pharma.png",
  EDUNEXT: "/EduNext.png",
  SCHOLAR: "/ScholarStream.png",
  BRAINB: "/BrainBoost.png",
  FRESHC: "/FreshCrave Foods.png",
  SPICER: "/SpiceRoute Dining.png",
  URBANB: "/UrbanBites.png",
};

type Timeframe = "1m" | "5m" | "10m" | "30m" | "overall";

const TICK_MAP: Record<Exclude<Timeframe, "overall">, number> = {
  "1m": 60,
  "5m": 300,
  "10m": 600,
  "30m": 1800,
};

interface StockDetailChartProps {
  stock: MarketItem;
  onBack: () => void;
  ownedQty: number;
  avgPrice: number;
  onTrade: () => void;
}

export const StockDetailChart: React.FC<StockDetailChartProps> = ({
  stock,
  onBack,
  ownedQty,
  avgPrice,
  onTrade,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("overall");

  const isPositive = (stock.change ?? 0) >= 0;
  const currentValue = ownedQty * (stock.price ?? 0);
  const pnl = ownedQty > 0 ? ((stock.price ?? 0) - avgPrice) * ownedQty : 0;

  // O(n) slice — no mutation, no deep clone
  const visibleData = useMemo(() => {
    const history = stock.priceHistory;
    if (!history || history.length === 0) return [];
    if (timeframe === "overall") return history;

    const count = TICK_MAP[timeframe];
    return history.slice(-count);
  }, [stock.priceHistory, timeframe]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-textMuted" />
        </button>
        <div className="w-12 h-12 rounded-full bg-surfaceElevated border border-border flex items-center justify-center overflow-hidden">
          <img
            src={COMPANY_LOGOS[stock.symbol] || ""}
            alt={stock.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textMain">{stock.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-textMuted">
              {stock.symbol}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surfaceElevated border border-border text-[10px] font-semibold text-textMuted uppercase tracking-wider">
              {stock.sector}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-textMain">
            ₹
            {(stock.price ?? 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? "text-primary" : "text-negative"}`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {isPositive ? "+" : ""}
            {(stock.change ?? 0).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Timeframe Controls */}
      <div className="flex gap-2">
        {(["1m", "5m", "10m", "30m", "overall"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              timeframe === tf
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "bg-surface border border-border text-textMuted hover:text-textMain hover:border-primary/30"
            }`}
          >
            {tf === "overall" ? "Overall" : tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card padding="sm">
        <StockChart data={visibleData} />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-textMuted mb-1">Open</div>
          <div className="font-mono font-bold">
            {visibleData.length > 0
              ? `₹${visibleData[0].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">High</div>
          <div className="font-mono font-bold text-primary">
            {visibleData.length > 0
              ? `₹${Math.max(...visibleData.map((p) => p.value)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">Low</div>
          <div className="font-mono font-bold text-negative">
            {visibleData.length > 0
              ? `₹${Math.min(...visibleData.map((p) => p.value)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">Sentiment</div>
          <div
            className={`font-bold ${stock.sentiment === "Bullish" ? "text-primary" : stock.sentiment === "Bearish" ? "text-negative" : "text-textMuted"}`}
          >
            {stock.sentiment}
          </div>
        </Card>
      </div>

      {/* Your Position */}
      {ownedQty > 0 && (
        <Card className="bg-gradient-to-r from-surface to-surfaceElevated">
          <h3 className="text-sm font-semibold text-textMuted mb-3">
            Your Position
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-textMuted">Quantity</div>
              <div className="font-mono font-bold">{ownedQty.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-textMuted">Avg Buy Price</div>
              <div className="font-mono font-bold">
                ₹
                {avgPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-textMuted">Current Value</div>
              <div className="font-mono font-bold">
                ₹
                {currentValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-textMuted">P&L</div>
              <div
                className={`font-mono font-bold ${pnl >= 0 ? "text-primary" : "text-negative"}`}
              >
                {pnl >= 0 ? "+" : ""}₹
                {pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Trade Button */}
      <div className="flex justify-center">
        <Button onClick={onTrade} className="px-10 py-3 text-lg">
          Trade {stock.symbol}
        </Button>
      </div>
    </div>
  );
};

```

## File: `components/dashboard/TradeModal.tsx`

```tsx
import React, { useState } from 'react';
import { X, Wallet, TrendingUp, TrendingDown, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketItem, Transaction } from '../../types';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketItem | null;
  balance: number;
  onConfirm: (type: 'buy' | 'sell', quantity: number) => void;
  ownedQuantity: number;
  transactions?: Transaction[];
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, 
  onClose, 
  asset, 
  balance, 
  onConfirm,
  ownedQuantity,
  transactions = []
}) => {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');
  
  if (!isOpen || !asset) return null;

  const qty = parseFloat(quantity) || 0;
  const total = qty * asset.price;
  const canBuy = type === 'buy' && total <= balance && total > 0;
  const canSell = type === 'sell' && qty <= ownedQuantity && qty > 0;
  const isValid = type === 'buy' ? canBuy : canSell;

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
              Trade {asset.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-textMuted">{asset.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-surfaceElevated border border-border text-[10px] font-semibold text-textMuted uppercase tracking-wider">
                {asset.sector}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Price Info */}
          <div className="flex justify-between items-center bg-surfaceElevated p-3 rounded-lg">
            <span className="text-sm text-textMuted">Current Price</span>
            <div className="text-right">
              <div className="font-bold text-lg font-mono">₹{(asset.price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`text-xs flex items-center justify-end gap-1 ${(asset.change ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                 {(asset.change ?? 0) >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                 {(asset.change ?? 0) >= 0 ? '+' : ''}{(asset.change ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-surfaceElevated p-1 rounded-lg">
            <button 
              onClick={() => setType('buy')}
              className={`py-2 text-sm font-semibold rounded-md transition-all ${type === 'buy' ? 'bg-primary text-background shadow-lg' : 'text-textMuted hover:text-textMain'}`}
            >
              Buy
            </button>
            <button 
              onClick={() => setType('sell')}
              className={`py-2 text-sm font-semibold rounded-md transition-all ${type === 'sell' ? 'bg-negative text-white shadow-lg' : 'text-textMuted hover:text-textMain'}`}
            >
              Sell
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
             <div>
                <label className="text-xs font-medium text-textMuted uppercase mb-1.5 block">Quantity</label>
                <div className="relative">
                   <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-lg font-bold text-textMain focus:outline-none focus:border-primary/50"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-textMuted font-medium">{asset.symbol}</span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                   <span className="text-textMuted">Owned: {ownedQuantity.toFixed(2)} {asset.symbol}</span>
                   <span className="text-textMuted">Max Buy: {Math.floor(balance / asset.price)}</span>
                </div>
             </div>

             <div className="flex justify-between items-center py-4 border-t border-dashed border-border">
                <span className="text-sm text-textMuted">Total Cost</span>
                <span className="text-xl font-bold text-textMain font-mono">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>

             <div className="bg-surfaceElevated p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-textMuted">
                   <Wallet className="w-4 h-4" />
                   <span className="text-xs">Wallet Balance</span>
                </div>
                <span className="text-sm font-semibold font-mono">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
          </div>

          <Button 
            onClick={() => onConfirm(type, qty)} 
            disabled={!isValid}
            className={`w-full py-3 ${type === 'sell' ? 'bg-negative hover:bg-negative/80' : ''}`}
          >
            {type === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
          </Button>

          {/* Transaction History for this stock */}
          {recentTx.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-textMuted" />
                <span className="text-xs font-semibold text-textMuted uppercase">Recent Trades</span>
              </div>
              <div className="space-y-2">
                {recentTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs bg-surfaceElevated p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${tx.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-negative/20 text-negative'}`}>
                        {tx.type}
                      </span>
                      <span className="font-mono text-textMain">{tx.quantity.toFixed(2)} @ ₹{tx.price.toFixed(2)}</span>
                    </div>
                    {tx.profitLoss !== undefined && (
                      <span className={`font-mono font-bold ${tx.profitLoss >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profitLoss >= 0 ? '+' : ''}₹{tx.profitLoss.toFixed(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## File: `components/landing/LandingPage.tsx`

```tsx
import React from 'react';
import { Button } from '../ui/Button';
import { ArrowRight, BarChart, Globe, Shield, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { APP_NAME } from '../../constants';
import { Card } from '../ui/Card';

interface LandingPageProps {
  onLogin: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 transition-all duration-300 backdrop-blur-md bg-background/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-primary shadow-[0_0_10px_rgba(30,211,166,0.5)]"></div>
             <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textMuted">
            <a href="#" className="hover:text-textMain transition-colors">Products</a>
            <a href="#" className="hover:text-textMain transition-colors">Community</a>
            <a href="#" className="hover:text-textMain transition-colors">Markets</a>
            <a href="#" className="hover:text-textMain transition-colors">News</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenAuth} className="text-sm font-medium hover:text-primary transition-colors">Log In</button>
            <Button onClick={onOpenAuth} size="sm" className="shadow-[0_0_20px_rgba(30,211,166,0.3)]">Get started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1614726365723-49faaa55bb89?q=80&w=2600&auto=format&fit=crop" 
            alt="Space Tech Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Market Data 2.0
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              Look first <span className="text-textMuted">/</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Then leap.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-textMuted max-w-2xl mx-auto font-light leading-relaxed">
              The best trades require research, then commitment. 
              <br className="hidden md:block"/> Unlock institutional-grade analytics for the modern era.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button onClick={onOpenAuth} size="lg" className="min-w-[200px] text-lg">
                Get started for free
              </Button>
              <button onClick={onOpenAuth} className="flex items-center gap-2 px-6 py-4 rounded-full border border-border bg-surface/50 backdrop-blur hover:bg-surface/80 transition-all text-textMain font-medium">
                <Globe className="w-5 h-5 text-primary" />
                Explore Markets
              </button>
            </div>

            <p className="text-xs text-textMuted pt-4 opacity-70">
              $0 forever, no credit card needed for basic tier.
            </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-textMuted">
            <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-border bg-surface/30 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { label: 'Active Traders', value: '2M+' },
                    { label: 'Data Points', value: '50B' },
                    { label: 'Markets Tracked', value: '150K' },
                    { label: 'Uptime', value: '99.9%' }
                ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm text-textMuted uppercase tracking-wider font-semibold">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold">Precision at your fingertips</h2>
                  <p className="text-textMuted text-lg">
                      Our dashboard consolidates the chaos of the market into actionable signals.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                  {[
                      { 
                          icon: TrendingUp, 
                          title: "Real-time Analytics", 
                          desc: "Streaming data with millisecond latency. Don't trade on yesterday's news.",
                          visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border">
                                <div className="absolute inset-0 flex items-center px-4">
                                    <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-2/3 rounded-full"></div>
                                    </div>
                                </div>
                             </div>
                          )
                      },
                      { 
                          icon: Shield, 
                          title: "Institutional Security", 
                          desc: "Enterprise-grade encryption and data protection protocols for your peace of mind.",
                          visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <div className="text-xs font-mono text-green-500">ENCRYPTED</div>
                             </div>
                          )
                      },
                      { 
                          icon: Zap, 
                          title: "Sentiment Analysis", 
                          desc: "AI-driven social sentiment tracking to predict market movements before they happen.",
                           visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border flex items-end justify-center px-2 pb-2 gap-1">
                                {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                    <div key={i} className="w-3 bg-primary/50 rounded-sm" style={{ height: `${h}%`}}></div>
                                ))}
                             </div>
                          )
                      }
                  ].map((feature, i) => (
                      <Card key={i} className="group hover:border-primary/50 transition-colors duration-300">
                          <div className="h-12 w-12 rounded-lg bg-surfaceElevated flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                              <feature.icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                          <p className="text-textMuted leading-relaxed mb-4">{feature.desc}</p>
                          {feature.visual}
                      </Card>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto relative">
              <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full"></div>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-b from-surfaceElevated to-surface text-center py-16 md:py-24 px-6">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to start your journey?</h2>
                  <p className="text-textMuted text-lg max-w-2xl mx-auto mb-10">
                      Join thousands of traders who have switched to {APP_NAME} for better insights and faster execution.
                  </p>
                  <Button onClick={onOpenAuth} size="lg" className="min-w-[200px] shadow-[0_0_30px_rgba(30,211,166,0.4)]">
                      Create free account
                  </Button>
              </Card>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-16 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                        <div className="w-5 h-5 rounded bg-primary"></div>
                        <span className="text-lg font-bold">{APP_NAME}</span>
                  </div>
                  <p className="text-textMuted max-w-xs mb-6">
                      Empowering traders with data-driven insights and professional tools.
                  </p>
                  <div className="flex gap-4">
                      {/* Social icons placeholders */}
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">𝕏</div>
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">in</div>
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">Ig</div>
                  </div>
              </div>
              
              {[
                  { title: "Platform", links: ["Markets", "Analytics", "Screeners", "Mobile App"] },
                  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
                  { title: "Resources", links: ["Help Center", "API Docs", "Community", "Blog"] }
              ].map((col, i) => (
                  <div key={i}>
                      <h4 className="font-bold mb-6 text-white">{col.title}</h4>
                      <ul className="space-y-4 text-sm text-textMuted">
                          {col.links.map(link => (
                              <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-sm text-textMuted gap-4">
              <p>© 2024 {APP_NAME} Inc. All rights reserved.</p>
              <div className="flex gap-6">
                  <a href="#" className="hover:text-white">Privacy Policy</a>
                  <a href="#" className="hover:text-white">Terms of Service</a>
              </div>
          </div>
      </footer>
    </div>
  );
};
```

## File: `components/ui/Button.tsx`

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-background hover:bg-secondary hover:shadow-[0_0_15px_rgba(30,211,166,0.3)]",
    secondary: "bg-surfaceElevated text-textMain hover:bg-border border border-border",
    ghost: "bg-transparent text-textMuted hover:text-textMain hover:bg-surfaceElevated/50",
    outline: "bg-transparent border border-primary text-primary hover:bg-primary/10"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## File: `components/ui/Card.tsx`

```tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  hoverEffect = false,
  onClick
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };

  const hoverStyles = hoverEffect 
    ? "hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surfaceElevated transition-all duration-300" 
    : "";

  return (
    <div onClick={onClick} className={`bg-surface border border-border rounded-[14px] ${paddings[padding]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};
```

## File: `constants.ts`

```typescript
import { MarketItem, StockDataPoint } from './types';
import { getGraphPrice } from './engine/graphPlaybackEngine';

export const APP_NAME = "VSX: Buy or Bail";

// Generate realistic looking chart data (legacy helper — kept for metrics only)
export const generateChartData = (points: number, startValue: number, volatility: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let currentValue = startValue;
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility;
    currentValue += change;
    data.push({
      time: `${i}h`,
      value: Math.max(0, currentValue),
    });
  }
  return data;
};

export const MAIN_CHART_DATA = generateChartData(100, 254672, 5000);

export const METRICS = [
  {
    id: '1',
    label: 'Market Cap',
    value: '₹2.4T',
    change: 3,
    history: generateChartData(20, 10, 5),
  },
  {
    id: '2',
    label: 'Volume',
    value: '₹363.89Cr',
    change: 13,
    history: generateChartData(20, 60, 10),
  },
  {
    id: '3',
    label: 'Active Traders',
    value: '40',
    change: 0,
    history: generateChartData(20, 40, 2),
  },
  {
    id: '4',
    label: 'Avg Portfolio',
    value: '₹1L',
    change: 0.2,
    history: generateChartData(20, 1, 0.1),
  },
];

// Market items use graph data for initial prices (tick 0)
// priceHistory starts empty — populated by live ticking in useMarket
export const INITIAL_MARKET_ITEMS: MarketItem[] = [
  // Automobile Sector
  { name: 'Velocity Auto', symbol: 'VELOCITY', price: getGraphPrice('VELOCITY', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'V', priceHistory: [] },
  { name: 'Apex Automotive', symbol: 'APEXAUTO', price: getGraphPrice('APEXAUTO', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Automobile', icon: 'A', priceHistory: [] },
  { name: 'Cruiser Dynamics', symbol: 'CRUISER', price: getGraphPrice('CRUISER', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'C', priceHistory: [] },

  // Health Sector
  { name: 'Vitalis Health', symbol: 'VITALIS', price: getGraphPrice('VITALIS', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Health', icon: 'V', priceHistory: [] },
  { name: 'CarePlus Hospitals', symbol: 'CAREPLUS', price: getGraphPrice('CAREPLUS', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Health', icon: 'C', priceHistory: [] },
  { name: 'Medisurge Pharma', symbol: 'MEDISURG', price: getGraphPrice('MEDISURG', 0), change: 0, sentiment: 'Bearish' as const, sector: 'Health', icon: 'M', priceHistory: [] },

  // EdTech Sector
  { name: 'EduNext', symbol: 'EDUNEXT', price: getGraphPrice('EDUNEXT', 0), change: 0, sentiment: 'Neutral' as const, sector: 'EdTech', icon: 'E', priceHistory: [] },
  { name: 'ScholarStream', symbol: 'SCHOLAR', price: getGraphPrice('SCHOLAR', 0), change: 0, sentiment: 'Bullish' as const, sector: 'EdTech', icon: 'S', priceHistory: [] },
  { name: 'BrainBoost', symbol: 'BRAINB', price: getGraphPrice('BRAINB', 0), change: 0, sentiment: 'Bearish' as const, sector: 'EdTech', icon: 'B', priceHistory: [] },

  // Food Sector
  { name: 'FreshCrave Foods', symbol: 'FRESHC', price: getGraphPrice('FRESHC', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Food', icon: 'F', priceHistory: [] },
  { name: 'SpiceRoute Dining', symbol: 'SPICER', price: getGraphPrice('SPICER', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'S', priceHistory: [] },
  { name: 'UrbanBites', symbol: 'URBANB', price: getGraphPrice('URBANB', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'U', priceHistory: [] },
];

export const SENTIMENT_DATA = [
  { name: 'Bullish', value: 65, color: '#1ED3A6' },
  { name: 'Neutral', value: 25, color: '#8FA6A0' },
  { name: 'Bearish', value: 10, color: '#EF4444' },
];
```

## File: `data/graphData.ts`

```typescript
/**
 * graphData.ts
 *
 * Imports the pre-generated graphData.json, validates its structure,
 * and exports a frozen, readonly typed object.
 *
 * In development: throws descriptive errors on invalid data.
 * In production: returns safe fallback defaults.
 */

import rawGraphData from './graphData.json';

const REQUIRED_SYMBOLS = [
    'VELOCITY', 'APEXAUTO', 'CRUISER', 'VITALIS',
    'CAREPLUS', 'MEDISURG', 'EDUNEXT', 'SCHOLAR',
    'BRAINB', 'FRESHC', 'SPICER', 'URBANB',
] as const;

export type SymbolKey = (typeof REQUIRED_SYMBOLS)[number];

export type GraphDataMap = Readonly<Record<SymbolKey, readonly number[]>>;

const DEFAULT_FALLBACK_PRICE = 100;
const FALLBACK_LENGTH = 100;

function createFallbackData(): GraphDataMap {
    const fallback: Record<string, number[]> = {};
    for (const sym of REQUIRED_SYMBOLS) {
        fallback[sym] = Array.from({ length: FALLBACK_LENGTH }, () => DEFAULT_FALLBACK_PRICE);
    }
    return Object.freeze(fallback) as GraphDataMap;
}

function validateAndFreeze(data: unknown): GraphDataMap {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('[graphData] Invalid data: expected an object mapping symbols to price arrays.');
    }

    const record = data as Record<string, unknown>;
    const errors: string[] = [];

    for (const sym of REQUIRED_SYMBOLS) {
        if (!(sym in record)) {
            errors.push(`Missing symbol: "${sym}"`);
            continue;
        }

        const arr = record[sym];
        if (!Array.isArray(arr)) {
            errors.push(`Symbol "${sym}" is not an array`);
            continue;
        }

        if (arr.length === 0) {
            errors.push(`Symbol "${sym}" has an empty array`);
            continue;
        }

        for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i])) {
                errors.push(`Symbol "${sym}" has non-finite value at index ${i}: ${arr[i]}`);
                break; // Report first bad value per symbol
            }
        }
    }

    if (errors.length > 0) {
        const msg = `[graphData] Validation errors:\n  - ${errors.join('\n  - ')}`;

        if (import.meta.env?.DEV) {
            throw new Error(msg);
        }

        console.error(msg);
        console.warn('[graphData] Falling back to safe defaults.');
        return createFallbackData();
    }

    // Freeze each array and the top-level object
    for (const sym of REQUIRED_SYMBOLS) {
        Object.freeze(record[sym]);
    }

    return Object.freeze(record) as GraphDataMap;
}

/**
 * Validated + frozen graph data. Keys are company symbols,
 * values are readonly arrays of prices (one per tick / second).
 */
export const graphData: GraphDataMap = validateAndFreeze(rawGraphData);

```

## File: `data/users.ts`

```typescript
import { User } from '../types';

const STARTING_CAPITAL = 100000; // ₹1 Lakh

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya',
  'Isha', 'Kiara', 'Riya', 'Priya', 'Neha',
  'Rohan', 'Karan', 'Rahul', 'Ajay', 'Vikram',
  'Nikhil', 'Amit', 'Raj', 'Dev', 'Yash',
  'Sneha', 'Pooja', 'Nisha', 'Kavya', 'Tanvi',
  'Meera', 'Zara', 'Aisha', 'Simran', 'Divya',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta',
  'Reddy', 'Joshi', 'Mehta', 'Nair', 'Iyer',
  'Verma', 'Malhotra', 'Kapoor', 'Bhat', 'Rao',
  'Saxena', 'Desai', 'Mishra', 'Chopra', 'Banerjee',
  'Das', 'Pillai', 'Menon', 'Kulkarni', 'Srinivasan',
  'Choudhury', 'Tiwari', 'Agarwal', 'Shah', 'Pandey',
  'Bose', 'Sen', 'Mukherjee', 'Chauhan', 'Yadav',
  'Jain', 'Thakur', 'Ranganathan', 'Trivedi', 'Saini',
];

export const generateUsers = (): User[] => {
  return FIRST_NAMES.map((firstName, i) => {
    const lastName = LAST_NAMES[i];
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    return {
      id: `user-${String(i + 1).padStart(3, '0')}`,
      username,
      password: `pass${String(i + 1).padStart(3, '0')}`,
      displayName: `${firstName} ${lastName}`,
      startingCapital: STARTING_CAPITAL,
      cashBalance: STARTING_CAPITAL,
      portfolio: [],
      transactions: [],
    };
  });
};

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export const STARTING_CAPITAL_DISPLAY = '₹1 Lakh';
export { STARTING_CAPITAL };

```

## File: `engine/graphPlaybackEngine.ts`

```typescript
/**
 * graphPlaybackEngine.ts
 *
 * Pure, deterministic graph price lookup.
 * O(1) per call. No side effects, no React, no Supabase.
 */

import { graphData, type SymbolKey } from '../data/graphData';

const MIN_PRICE = 10;
const FALLBACK_PRICE = 100;

/**
 * Get the graph-driven price for a given symbol at a given tick.
 *
 * Rules:
 *  - Clamps tick to [0, arr.length - 1]
 *  - Clamps result to minimum ₹10
 *  - Rounds to 2 decimal places
 *  - Returns FALLBACK_PRICE for unknown symbols
 *  - Never returns NaN, never throws
 */
export function getGraphPrice(symbol: string, tick: number): number {
    const prices = graphData[symbol as SymbolKey];

    // Unknown symbol → safe fallback
    if (!prices || prices.length === 0) {
        return FALLBACK_PRICE;
    }

    // Clamp tick
    const safeTick = Math.max(0, Math.min(tick, prices.length - 1));
    const rawPrice = prices[safeTick];

    // Guard against corrupted data
    if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice)) {
        return FALLBACK_PRICE;
    }

    // Clamp minimum and round
    return parseFloat(Math.max(MIN_PRICE, rawPrice).toFixed(2));
}

/**
 * Get the total number of ticks available for a given symbol.
 * Returns 0 for unknown symbols.
 */
export function getGraphLength(symbol: string): number {
    const prices = graphData[symbol as SymbolKey];
    return prices ? prices.length : 0;
}

```

## File: `engine/priceEngine.ts`

```typescript
import { MarketItem, StockDataPoint, NewsEvent } from '../types';
import { getGraphPrice } from './graphPlaybackEngine';

/**
 * Advance a single stock by one tick using deterministic graph data.
 *
 * Flow:
 *  1. Look up base price from graphData at the given tick
 *  2. If a news override is active for this symbol, apply crash/boost factor
 *  3. Compute change % from the first entry in priceHistory
 *  4. Append new data point to priceHistory (capped at 200)
 *  5. Return a NEW MarketItem — no mutation
 */
export const tickPrice = (
  item: MarketItem,
  tick: number,
  activeNewsEvents?: NewsEvent[]
): MarketItem => {
  // 1. Base price from graph
  let newPrice = getGraphPrice(item.symbol, tick);

  // 2. Apply active news override (crash or boost)
  if (activeNewsEvents && activeNewsEvents.length > 0) {
    for (const event of activeNewsEvents) {
      if (!event.active) continue;

      if (item.symbol === event.crashCompany) {
        // crashPercent is already negative (e.g. -15)
        const factor = 1 + event.crashPercent / 100;
        newPrice = parseFloat((newPrice * factor).toFixed(2));
        break;
      }

      if (event.boostCompanies.includes(item.symbol)) {
        const factor = 1 + event.boostPercent / 100;
        newPrice = parseFloat((newPrice * factor).toFixed(2));
        break;
      }
    }
  }

  // Ensure minimum price
  newPrice = Math.max(10, newPrice);
  newPrice = parseFloat(newPrice.toFixed(2));

  // 3. Build new history entry
  const timeLabel = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const newHistory: StockDataPoint[] = [
    ...(item.priceHistory || []).slice(-1999),
    { time: timeLabel, value: newPrice },
  ];

  // 4. Compute change % from first visible price
  const firstPrice = newHistory[0]?.value || item.price;
  const totalChange = firstPrice !== 0
    ? ((newPrice - firstPrice) / firstPrice) * 100
    : 0;

  // 5. Determine sentiment based on change
  const sentiment: 'Bullish' | 'Bearish' | 'Neutral' =
    totalChange > 0.5 ? 'Bullish' :
      totalChange < -0.5 ? 'Bearish' : 'Neutral';

  return {
    ...item,
    price: newPrice,
    change: parseFloat(totalChange.toFixed(2)),
    sentiment,
    priceHistory: newHistory,
  };
};

/**
 * Tick all market items using their individual tick counters.
 * O(n) where n = number of stocks (12).
 */
export const tickAllPrices = (
  items: MarketItem[],
  ticks: Record<string, number>,
  activeNewsEvents?: NewsEvent[]
): MarketItem[] => {
  return items.map(item => {
    const tick = ticks[item.symbol] ?? 0;
    return tickPrice(item, tick, activeNewsEvents);
  });
};

/**
 * Apply a news event — immediately shock prices and flip sentiments.
 * This is a one-shot operation triggered by the admin.
 * Unchanged from original — works with current price, not graph data.
 */
export const applyNewsEvent = (items: MarketItem[], event: NewsEvent): MarketItem[] => {
  return items.map(item => {
    if (item.symbol === event.crashCompany) {
      const factor = 1 + event.crashPercent / 100; // crashPercent is negative
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory: StockDataPoint[] = [
        ...(item.priceHistory || []).slice(-199),
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: newPrice,
        },
      ];
      const firstPrice = newHistory[0]?.value || item.price;
      return {
        ...item,
        price: newPrice,
        change: parseFloat((((newPrice - firstPrice) / firstPrice) * 100).toFixed(2)),
        sentiment: 'Bearish' as const,
        priceHistory: newHistory,
      };
    }

    if (event.boostCompanies.includes(item.symbol)) {
      const factor = 1 + event.boostPercent / 100; // boostPercent is positive
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory: StockDataPoint[] = [
        ...(item.priceHistory || []).slice(-199),
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: newPrice,
        },
      ];
      const firstPrice = newHistory[0]?.value || item.price;
      return {
        ...item,
        price: newPrice,
        change: parseFloat((((newPrice - firstPrice) / firstPrice) * 100).toFixed(2)),
        sentiment: 'Bullish' as const,
        priceHistory: newHistory,
      };
    }

    return item;
  });
};

/**
 * Stop a news event — revert affected stocks to Neutral sentiment.
 * Unchanged from original.
 */
export const stopNewsEvent = (items: MarketItem[], event: NewsEvent): MarketItem[] => {
  return items.map(item => {
    if (item.symbol === event.crashCompany || event.boostCompanies.includes(item.symbol)) {
      return { ...item, sentiment: 'Neutral' as const };
    }
    return item;
  });
};

```

## File: `engine/tests/graphPlaybackEngine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getGraphPrice, getGraphLength } from '../graphPlaybackEngine';

describe('getGraphPrice', () => {
    it('returns a finite number for tick 0 of a known symbol', () => {
        const price = getGraphPrice('VELOCITY', 0);
        expect(typeof price).toBe('number');
        expect(Number.isFinite(price)).toBe(true);
        expect(price).toBeGreaterThanOrEqual(10);
    });

    it('returns correct tick retrieval (different ticks give potentially different prices)', () => {
        const p0 = getGraphPrice('VELOCITY', 0);
        const p10 = getGraphPrice('VELOCITY', 10);
        // At minimum both should be valid numbers
        expect(Number.isFinite(p0)).toBe(true);
        expect(Number.isFinite(p10)).toBe(true);
    });

    it('clamps tick beyond array length to last price', () => {
        const len = getGraphLength('VELOCITY');
        expect(len).toBeGreaterThan(0);

        const lastPrice = getGraphPrice('VELOCITY', len - 1);
        const beyondPrice = getGraphPrice('VELOCITY', len + 1000);
        expect(beyondPrice).toBe(lastPrice);
    });

    it('clamps negative tick to 0', () => {
        const p0 = getGraphPrice('VELOCITY', 0);
        const pNeg = getGraphPrice('VELOCITY', -5);
        expect(pNeg).toBe(p0);
    });

    it('enforces minimum price of ₹10', () => {
        // All prices from the graph should be >= 10
        for (let tick = 0; tick < 100; tick++) {
            const price = getGraphPrice('VELOCITY', tick);
            expect(price).toBeGreaterThanOrEqual(10);
        }
    });

    it('returns prices rounded to 2 decimal places', () => {
        const price = getGraphPrice('VELOCITY', 5);
        const decimals = price.toString().split('.')[1];
        if (decimals) {
            expect(decimals.length).toBeLessThanOrEqual(2);
        }
    });

    it('returns fallback price for unknown symbol', () => {
        const price = getGraphPrice('UNKNOWN_SYMBOL', 0);
        expect(price).toBe(100); // FALLBACK_PRICE
    });

    it('returns fallback price for empty string symbol', () => {
        const price = getGraphPrice('', 0);
        expect(price).toBe(100);
    });

    it('never returns NaN', () => {
        const symbols = ['VELOCITY', 'APEXAUTO', 'CRUISER', 'UNKNOWN', '', 'null'];
        const ticks = [-1, 0, 1, 100, 99999, NaN];
        for (const sym of symbols) {
            for (const tick of ticks) {
                const price = getGraphPrice(sym, tick);
                expect(Number.isNaN(price)).toBe(false);
            }
        }
    });

    it('works for all 12 symbols', () => {
        const symbols = [
            'VELOCITY', 'APEXAUTO', 'CRUISER', 'VITALIS',
            'CAREPLUS', 'MEDISURG', 'EDUNEXT', 'SCHOLAR',
            'BRAINB', 'FRESHC', 'SPICER', 'URBANB',
        ];
        for (const sym of symbols) {
            const price = getGraphPrice(sym, 0);
            expect(typeof price).toBe('number');
            expect(Number.isFinite(price)).toBe(true);
            expect(price).toBeGreaterThanOrEqual(10);
            expect(getGraphLength(sym)).toBeGreaterThan(0);
        }
    });
});

describe('getGraphLength', () => {
    it('returns > 0 for known symbols', () => {
        expect(getGraphLength('VELOCITY')).toBeGreaterThan(0);
    });

    it('returns 0 for unknown symbols', () => {
        expect(getGraphLength('UNKNOWN')).toBe(0);
    });
});

```

## File: `engine/tests/priceEngine.integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { tickPrice, tickAllPrices, applyNewsEvent, stopNewsEvent } from '../priceEngine';
import type { MarketItem, NewsEvent } from '../../types';

function createMockItem(symbol: string, price: number = 100): MarketItem {
    return {
        name: `Test ${symbol}`,
        symbol,
        price,
        change: 0,
        sentiment: 'Neutral',
        sector: 'Test',
        icon: 'T',
        priceHistory: [],
    };
}

function createMockNewsEvent(overrides: Partial<NewsEvent> = {}): NewsEvent {
    return {
        id: 'test-event-1',
        headline: 'Test News',
        crashCompany: 'VELOCITY',
        crashPercent: -15,
        boostCompanies: ['APEXAUTO'],
        boostPercent: 8,
        timestamp: Date.now(),
        active: true,
        ...overrides,
    };
}

describe('tickPrice (graph-driven)', () => {
    it('returns a new MarketItem without mutating the original', () => {
        const item = createMockItem('VELOCITY');
        const original = { ...item };
        const result = tickPrice(item, 0);

        // Original should be unchanged
        expect(item.price).toBe(original.price);
        expect(item.priceHistory).toBe(original.priceHistory);

        // Result should be a new object
        expect(result).not.toBe(item);
        expect(typeof result.price).toBe('number');
        expect(result.priceHistory.length).toBe(1);
    });

    it('produces prices from graph data at the given tick', () => {
        const item = createMockItem('VELOCITY');
        const r0 = tickPrice(item, 0);
        const r5 = tickPrice(item, 5);

        expect(Number.isFinite(r0.price)).toBe(true);
        expect(Number.isFinite(r5.price)).toBe(true);
        expect(r0.price).toBeGreaterThanOrEqual(10);
        expect(r5.price).toBeGreaterThanOrEqual(10);
    });

    it('applies news crash override on top of graph price', () => {
        const item = createMockItem('VELOCITY', 200);
        const event = createMockNewsEvent({ crashCompany: 'VELOCITY', crashPercent: -20 });

        const withoutNews = tickPrice(item, 10);
        const withNews = tickPrice(item, 10, [event]);

        // With a 20% crash, the price should be lower
        expect(withNews.price).toBeLessThan(withoutNews.price);
    });

    it('applies news boost override on top of graph price', () => {
        const item = createMockItem('APEXAUTO', 200);
        const event = createMockNewsEvent({ boostCompanies: ['APEXAUTO'], boostPercent: 10 });

        const withoutNews = tickPrice(item, 10);
        const withNews = tickPrice(item, 10, [event]);

        // With a 10% boost, the price should be higher
        expect(withNews.price).toBeGreaterThan(withoutNews.price);
    });

    it('resumes normal graph playback after news stops', () => {
        const item = createMockItem('VELOCITY', 200);
        const inactiveEvent = createMockNewsEvent({ active: false });

        const normal = tickPrice(item, 10);
        const afterStop = tickPrice(item, 10, [inactiveEvent]);

        // With inactive event, should be same as no event
        expect(afterStop.price).toBe(normal.price);
    });

    it('computes change percentage correctly', () => {
        const item = createMockItem('VELOCITY', 100);
        // Add an initial history point
        const itemWithHistory: MarketItem = {
            ...item,
            priceHistory: [{ time: '10:00:00 AM', value: 100 }],
        };

        const result = tickPrice(itemWithHistory, 5);
        // Change should be ((newPrice - 100) / 100) * 100
        const expectedChange = ((result.price - 100) / 100) * 100;
        expect(result.change).toBeCloseTo(expectedChange, 1);
    });

    it('caps priceHistory at 200 entries', () => {
        const longHistory = Array.from({ length: 250 }, (_, i) => ({
            time: `${i}`,
            value: 100 + i,
        }));
        const item: MarketItem = {
            ...createMockItem('VELOCITY'),
            priceHistory: longHistory,
        };

        const result = tickPrice(item, 0);
        expect(result.priceHistory.length).toBeLessThanOrEqual(200);
    });
});

describe('tickAllPrices', () => {
    it('ticks all items independently using their own tick counters', () => {
        const items = [
            createMockItem('VELOCITY'),
            createMockItem('APEXAUTO'),
        ];
        const ticks = { VELOCITY: 10, APEXAUTO: 20 };

        const result = tickAllPrices(items, ticks);

        expect(result.length).toBe(2);
        expect(result[0].symbol).toBe('VELOCITY');
        expect(result[1].symbol).toBe('APEXAUTO');
        // Both should have valid prices
        expect(Number.isFinite(result[0].price)).toBe(true);
        expect(Number.isFinite(result[1].price)).toBe(true);
    });

    it('does not mutate the original array', () => {
        const items = [createMockItem('VELOCITY')];
        const ticks = { VELOCITY: 0 };
        const result = tickAllPrices(items, ticks);

        expect(result).not.toBe(items);
        expect(result[0]).not.toBe(items[0]);
    });
});

describe('applyNewsEvent', () => {
    it('crashes the target company', () => {
        const items = [createMockItem('VELOCITY', 1000)];
        const event = createMockNewsEvent({ crashCompany: 'VELOCITY', crashPercent: -20 });

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(800); // 1000 * (1 - 0.20)
        expect(result[0].sentiment).toBe('Bearish');
    });

    it('boosts benefiting companies', () => {
        const items = [createMockItem('APEXAUTO', 1000)];
        const event = createMockNewsEvent({ boostCompanies: ['APEXAUTO'], boostPercent: 10 });

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(1100); // 1000 * (1 + 0.10)
        expect(result[0].sentiment).toBe('Bullish');
    });

    it('does not affect unrelated stocks', () => {
        const items = [createMockItem('CRUISER', 500)];
        const event = createMockNewsEvent();

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(500);
        expect(result[0].sentiment).toBe('Neutral');
    });
});

describe('stopNewsEvent', () => {
    it('reverts affected stocks to Neutral sentiment', () => {
        const items = [
            { ...createMockItem('VELOCITY', 800), sentiment: 'Bearish' as const },
            { ...createMockItem('APEXAUTO', 1100), sentiment: 'Bullish' as const },
            { ...createMockItem('CRUISER', 500), sentiment: 'Neutral' as const },
        ];
        const event = createMockNewsEvent();

        const result = stopNewsEvent(items, event);
        expect(result[0].sentiment).toBe('Neutral');
        expect(result[1].sentiment).toBe('Neutral');
        expect(result[2].sentiment).toBe('Neutral');
    });
});

```

## File: `generate_context.mjs`

```javascript
/**
 * generate_context.mjs
 * Regenerates codebase-context.md with all source files.
 * Run: node generate_context.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const OUTPUT = join(ROOT, 'codebase-context.md');

const INCLUDE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.md', '.html', '.sql'
]);

const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', '.gemini', '.vscode', '.idea', 'coverage'
]);

const EXCLUDE_FILES = new Set([
  'codebase-context.md', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'
]);

// Limit JSON files that are too large
const MAX_FILE_SIZE = 50_000; // 50KB

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        walk(join(dir, entry.name), files);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (INCLUDE_EXTENSIONS.has(ext) && !EXCLUDE_FILES.has(entry.name)) {
        const fullPath = join(dir, entry.name);
        const stat = statSync(fullPath);
        if (stat.size <= MAX_FILE_SIZE) {
          files.push(fullPath);
        }
      }
    }
  }
  return files;
}

const files = walk(ROOT).sort();
const langMap = {
  '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.mjs': 'javascript',
  '.css': 'css', '.json': 'json', '.md': 'markdown', '.html': 'html', '.sql': 'sql'
};

let output = `# Codebase Context\n\nThis file contains the full context of the codebase to be used by LLMs.\nGenerated at: ${new Date().toISOString()}\n\n`;

for (const f of files) {
  const rel = relative(ROOT, f);
  const ext = extname(f);
  const lang = langMap[ext] || '';
  const content = readFileSync(f, 'utf-8');
  output += `## File: \`${rel}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
}

writeFileSync(OUTPUT, output);
console.log(`✅ Generated ${OUTPUT}`);
console.log(`   ${files.length} files, ${(output.length / 1024).toFixed(1)} KB`);

```

## File: `hooks/tests/useMarket.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * useMarket.test.ts
 *
 * Tests for the useMarket hook behavior.
 * Since useMarket depends on Supabase (which we mock), these tests
 * focus on the tick logic and state management patterns.
 */

// Mock supabase before importing anything that uses it
vi.mock('../../lib/supabaseClient', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
            }),
        }),
        channel: () => ({
            on: function () { return this; },
            subscribe: () => ({}),
        }),
        removeChannel: () => { },
    },
}));

describe('useMarket tick logic', () => {
    it('tick counter increments correctly', () => {
        // Simulating the tick increment logic from useMarket
        const ticks: Record<string, number> = {
            VELOCITY: 0,
            APEXAUTO: 0,
        };

        // Simulate one tick
        const newTicks: Record<string, number> = {};
        for (const sym in ticks) {
            newTicks[sym] = (ticks[sym] ?? 0) + 1;
        }

        expect(newTicks.VELOCITY).toBe(1);
        expect(newTicks.APEXAUTO).toBe(1);

        // Simulate another tick
        const newTicks2: Record<string, number> = {};
        for (const sym in newTicks) {
            newTicks2[sym] = (newTicks[sym] ?? 0) + 1;
        }

        expect(newTicks2.VELOCITY).toBe(2);
        expect(newTicks2.APEXAUTO).toBe(2);
    });

    it('tick counter does not mutate original object', () => {
        const ticks = { VELOCITY: 5, APEXAUTO: 10 };
        const original = { ...ticks };

        const newTicks: Record<string, number> = {};
        for (const sym in ticks) {
            newTicks[sym] = (ticks[sym] ?? 0) + 1;
        }

        // Original should be unchanged
        expect(ticks.VELOCITY).toBe(original.VELOCITY);
        expect(ticks.APEXAUTO).toBe(original.APEXAUTO);

        // New should be incremented
        expect(newTicks.VELOCITY).toBe(6);
        expect(newTicks.APEXAUTO).toBe(11);
    });

    it('reset creates fresh tick counters at 0', () => {
        const ticks = { VELOCITY: 100, APEXAUTO: 200 };

        // Reset logic
        const resetTicks: Record<string, number> = {};
        for (const sym in ticks) {
            resetTicks[sym] = 0;
        }

        expect(resetTicks.VELOCITY).toBe(0);
        expect(resetTicks.APEXAUTO).toBe(0);
    });

    it('interval clears properly on cleanup', () => {
        const clearSpy = vi.spyOn(global, 'clearInterval');
        const intervalId = setInterval(() => { }, 5000);
        clearInterval(intervalId);

        expect(clearSpy).toHaveBeenCalledWith(intervalId);
        clearSpy.mockRestore();
    });

    it('only one interval should exist at a time', () => {
        const intervals: ReturnType<typeof setInterval>[] = [];

        // Simulate the pattern from useMarket
        const createInterval = () => {
            const id = setInterval(() => { }, 5000);
            intervals.push(id);
            return id;
        };

        const cleanup = (id: ReturnType<typeof setInterval>) => {
            clearInterval(id);
        };

        // First mount
        const id1 = createInterval();
        expect(intervals.length).toBe(1);

        // Cleanup + remount (simulating useEffect cleanup)
        cleanup(id1);
        const id2 = createInterval();

        // After cleanup + recreation, we should still only have one active
        cleanup(id2);
    });
});

```

## File: `hooks/useMarket.ts`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { tickAllPrices } from '../engine/priceEngine';
import { getGraphPrice } from '../engine/graphPlaybackEngine';
import type { NewsEvent } from './useNews';

export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sector: string;
  icon: string;
  price_history: { time: string; value: number }[];
  priceHistory: { time: string; value: number }[]; // Alias for compatibility
}

// Transform database row — use graph data for initial price instead of random history
const transformMarketItem = (item: any): MarketItem => {
  const initialPrice = getGraphPrice(item.symbol, 0);
  return {
    ...item,
    price: initialPrice,
    change: 0,
    price_history: [],
    priceHistory: [],
  };
};

export function useMarket() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Per-stock tick counters — persisted across re-renders
  const ticksRef = useRef<Record<string, number>>({});

  // Reference to active news events — updated externally
  const activeNewsRef = useRef<NewsEvent[]>([]);

  // Fetch initial market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .order('symbol');
        if (error) throw error;
        if (data) {
          const items = data.map(transformMarketItem);
          // Initialize tick counters for each symbol at 0
          const ticks: Record<string, number> = {};
          for (const item of items) {
            ticks[item.symbol] = 0;
          }
          ticksRef.current = ticks;
          setMarketItems(items);
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Client-side price ticking — simulate live market every 5 seconds
  useEffect(() => {
    if (!initializedRef.current || marketItems.length === 0) return;

    const tickInterval = setInterval(() => {
      // Increment ticks for each symbol
      const currentTicks = ticksRef.current;
      const newTicks: Record<string, number> = {};
      for (const sym in currentTicks) {
        newTicks[sym] = (currentTicks[sym] ?? 0) + 1;
      }
      ticksRef.current = newTicks;

      // Functional state update — no mutation of previous state
      setMarketItems(prev => {
        if (prev.length === 0) return prev;
        return tickAllPrices(prev, newTicks, activeNewsRef.current);
      });
    }, 1000); // 1 tick per second — 7200 ticks = 2 hours

    return () => clearInterval(tickInterval);
  }, [marketItems.length]);

  // Subscribe to real-time DB changes (admin actions like news events, price resets)
  useEffect(() => {
    const channel = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_items' },
        (payload) => {
          const updated = payload.new as any;
          setMarketItems(prev =>
            prev.map(item => {
              if (item.symbol === updated.symbol) {
                return {
                  ...item,
                  ...updated,
                  priceHistory: item.priceHistory, // preserve client-side history
                  price_history: item.priceHistory,
                };
              }
              return item;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Method to update the active news events reference
  const setActiveNews = useCallback((events: NewsEvent[]) => {
    activeNewsRef.current = events.filter(e => e.active);
  }, []);

  // Method to reset ticks (used by reset auction)
  const resetTicks = useCallback(() => {
    const ticks: Record<string, number> = {};
    for (const sym in ticksRef.current) {
      ticks[sym] = 0;
    }
    ticksRef.current = ticks;
  }, []);

  // Get current ticks (for admin UI)
  const getTicks = useCallback((): Record<string, number> => {
    return { ...ticksRef.current };
  }, []);

  return {
    marketItems,
    setMarketItems,
    loading,
    setActiveNews,
    resetTicks,
    getTicks,
  };
}

```

## File: `hooks/useNews.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MarketItem } from './useMarket';

export interface NewsEvent {
  id: string;
  headline: string;
  crash_company: string;
  crash_percent: number;
  boost_companies: string[];
  boost_percent: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export function useNews() {
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial news events
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('news_events')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setNewsEvents(data as NewsEvent[]);
      } catch (err) {
        console.error('Error fetching news events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Subscribe to real-time news changes (INSERT + UPDATE)
  useEffect(() => {
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news_events' },
        (payload) => {
          console.log('[Realtime] News INSERT received:', payload.new);
          const newEvent = payload.new as NewsEvent;
          setNewsEvents(prev => [newEvent, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'news_events' },
        (payload) => {
          console.log('[Realtime] News UPDATE received:', payload.new);
          const updated = payload.new as NewsEvent;
          setNewsEvents(prev =>
            prev.map(e => e.id === updated.id ? updated : e)
          );
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] news-changes subscription status:', status);
      });

    // Polling fallback: fetch every 5 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('news_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setNewsEvents(prev => {
          // Only update if there are changes to avoid unnecessary re-renders
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(data);
          return isDifferent ? (data as NewsEvent[]) : prev;
        });
      }
    }, 5000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, []);

  // Admin: trigger a news flash
  const triggerNews = async (
    headline: string,
    crashCompany: string,
    crashPercent: number,
    boostCompanies: string[],
    boostPercent: number,
    marketItems: MarketItem[],
    adminId: string
  ) => {
    // 1. Insert news event
    const { data: event, error: newsError } = await supabase
      .from('news_events')
      .insert({
        headline,
        crash_company: crashCompany,
        crash_percent: crashPercent,
        boost_companies: boostCompanies,
        boost_percent: boostPercent,
        active: true,
        created_by: adminId,
      })
      .select()
      .single();

    if (newsError) return { error: newsError.message };

    // 2. Update market prices
    const updates: PromiseLike<any>[] = [];

    // Crash company
    const crashItem = marketItems.find(m => m.symbol === crashCompany);
    if (crashItem) {
      const newPrice = +(crashItem.price * (1 - crashPercent / 100)).toFixed(2);
      updates.push(
        supabase
          .from('market_items')
          .update({
            price: newPrice,
            change: -crashPercent,
            sentiment: 'Bearish',
          })
          .eq('symbol', crashCompany)
      );
    }

    // Boost companies
    for (const sym of boostCompanies) {
      const item = marketItems.find(m => m.symbol === sym);
      if (item) {
        const newPrice = +(item.price * (1 + boostPercent / 100)).toFixed(2);
        updates.push(
          supabase
            .from('market_items')
            .update({
              price: newPrice,
              change: boostPercent,
              sentiment: 'Bullish',
            })
            .eq('symbol', sym)
        );
      }
    }

    await Promise.all(updates);
    return { error: null, event };
  };

  // Admin: stop a news flash
  const stopNews = async (eventId: string, event: NewsEvent, marketItems: MarketItem[]) => {
    // Mark event as inactive
    await supabase
      .from('news_events')
      .update({ active: false })
      .eq('id', eventId);

    // Revert sentiments to Neutral
    const affectedSymbols = [event.crash_company, ...event.boost_companies];
    const updates = affectedSymbols.map(sym =>
      supabase
        .from('market_items')
        .update({ sentiment: 'Neutral', change: 0 })
        .eq('symbol', sym)
    );
    await Promise.all(updates);
  };

  return { newsEvents, loading, triggerNews, stopNews };
}

```

## File: `hooks/usePortfolio.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PortfolioItem {
  id: string;
  user_id: string;
  symbol: string;
  amount: number;
  avg_price: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  asset_name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchase_price?: number;
  profit_loss?: number;
  created_at: string;
}

export function usePortfolio(userId: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio and transactions
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [{ data: pData, error: pError }, { data: tData, error: tError }] = await Promise.all([
          supabase.from('portfolios').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);
        
        if (pError) throw pError;
        if (tError) throw tError;

        if (pData) setPortfolio(pData as PortfolioItem[]);
        if (tData) setTransactions(tData as Transaction[]);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    // Polling fallback: fetch every 5 seconds
    const interval = setInterval(async () => {
      const [{ data: pData }, { data: tData }] = await Promise.all([
        supabase.from('portfolios').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      
      if (pData) {
        setPortfolio(prev => {
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(pData);
          return isDifferent ? (pData as PortfolioItem[]) : prev;
        });
      }
      if (tData) {
        setTransactions(prev => {
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(tData);
          return isDifferent ? (tData as Transaction[]) : prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  // Execute a trade
  const executeTrade = async (
    userId: string,
    symbol: string,
    assetName: string,
    type: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    currentBalance: number,
    purchasePrice?: number
  ): Promise<{ error: string | null }> => {
    const totalCost = quantity * price;

    if (type === 'BUY') {
      if (totalCost > currentBalance) return { error: 'Insufficient funds' };

      // Update balance
      const newBalance = currentBalance - totalCost;
      await supabase.from('profiles').update({ cash_balance: newBalance }).eq('id', userId);

      // Upsert portfolio
      const existing = portfolio.find(p => p.symbol === symbol);
      if (existing) {
        const newAmount = existing.amount + quantity;
        const newAvg = ((existing.avg_price * existing.amount) + (price * quantity)) / newAmount;
        await supabase.from('portfolios').update({ amount: newAmount, avg_price: +newAvg.toFixed(2) }).eq('id', existing.id);
        setPortfolio(prev => prev.map(p => p.id === existing.id ? { ...p, amount: newAmount, avg_price: +newAvg.toFixed(2) } : p));
      } else {
        const { data } = await supabase.from('portfolios').insert({ user_id: userId, symbol, amount: quantity, avg_price: price }).select().single();
        if (data) setPortfolio(prev => [...prev, data as PortfolioItem]);
      }

      // Log transaction
      const { data: tx } = await supabase.from('transactions').insert({
        user_id: userId, symbol, asset_name: assetName, type: 'BUY', quantity, price,
      }).select().single();
      if (tx) setTransactions(prev => [tx as Transaction, ...prev]);

    } else {
      // SELL
      const existing = portfolio.find(p => p.symbol === symbol);
      if (!existing || existing.amount < quantity) return { error: 'Not enough shares' };

      const newBalance = currentBalance + totalCost;
      const profitLoss = (price - (purchasePrice || existing.avg_price)) * quantity;
      await supabase.from('profiles').update({ cash_balance: newBalance }).eq('id', userId);

      const newAmount = existing.amount - quantity;
      if (newAmount === 0) {
        await supabase.from('portfolios').delete().eq('id', existing.id);
        setPortfolio(prev => prev.filter(p => p.id !== existing.id));
      } else {
        await supabase.from('portfolios').update({ amount: newAmount }).eq('id', existing.id);
        setPortfolio(prev => prev.map(p => p.id === existing.id ? { ...p, amount: newAmount } : p));
      }

      const { data: tx } = await supabase.from('transactions').insert({
        user_id: userId, symbol, asset_name: assetName, type: 'SELL', quantity, price,
        purchase_price: purchasePrice || existing.avg_price, profit_loss: +profitLoss.toFixed(2),
      }).select().single();
      if (tx) setTransactions(prev => [tx as Transaction, ...prev]);
    }

    return { error: null };
  };

  return { portfolio, transactions, loading, executeTrade };
}

```

## File: `hooks/useSync.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:4000';

export type SyncMessage =
  | { type: 'NEWS_TRIGGERED'; payload: any }
  | { type: 'NEWS_STOPPED'; payload: { eventId: string } }
  | { type: 'MARKET_UPDATE'; payload: any[] }
  | { type: 'SIMULATION_RESET' };

export function useSync(onMessage: (msg: SyncMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('🔌 Sync connected');
          wsRef.current = ws;
        };

        ws.onmessage = (e) => {
          try {
            const msg: SyncMessage = JSON.parse(e.data);
            onMessageRef.current(msg);
          } catch { /* ignore bad messages */ }
        };

        ws.onclose = () => {
          wsRef.current = null;
          // Reconnect after 2 seconds
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const broadcast = useCallback((msg: SyncMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { broadcast };
}

```

## File: `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0B0F0E" />
    <link rel="icon" type="image/png" href="/vsx-logo.png" />
    <link rel="apple-touch-icon" href="/vsx-logo.png" />
    <title>VSX: Buy or Bail</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ["Plus Jakarta Sans", "sans-serif"],
            },
            colors: {
              background: "#0B0F0E",
              surface: "#121917",
              surfaceElevated: "#18211E",
              primary: "#1ED3A6",
              secondary: "#14B8A6",
              textMain: "#E6F1EE",
              textMuted: "#8FA6A0",
              border: "#1F2A26",
              positive: "#22C55E",
              negative: "#EF4444",
            },
          },
        },
      };
    </script>
    <style>
      body {
        background-color: #0b0f0e;
        color: #e6f1ee;
      }
      /* Custom scrollbar for dashboard look */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #0b0f0e;
      }
      ::-webkit-scrollbar-thumb {
        background: #1f2a26;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #1ed3a6;
      }
      .recharts-cartesian-grid-horizontal line,
      .recharts-cartesian-grid-vertical line {
        stroke: #1f2a26;
      }
      button:focus,
      button:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    </style>
    <script type="importmap">
      {
        "imports": {
          "recharts": "https://esm.sh/recharts@^3.7.0",
          "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
          "react/": "https://esm.sh/react@^19.2.4/",
          "react": "https://esm.sh/react@^19.2.4",
          "react-dom/": "https://esm.sh/react-dom@^19.2.4/"
        }
      }
    </script>
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>

```

## File: `index.tsx`

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './components/auth/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

## File: `lib/supabaseAdmin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// Service role key for admin operations - should be kept secure
// In production, this should be stored server-side and accessed via API
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL in environment variables');
}

if (!serviceRoleKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not found. Admin operations may fail.');
}

// Admin client with service role key for admin operations
// WARNING: This should ideally be used server-side only
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

```

## File: `lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

```

## File: `metadata.json`

```json
{
  "name": "VSX: Buy or Bail",
  "description": "A modern, high-performance stock market analytics platform featuring deep insights, sentiment analysis, and a cinematic user experience.",
  "requestFramePermissions": []
}
```

## File: `package.json`

```json
{
  "name": "novatrade-analytics",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.97.0",
    "lucide-react": "^0.563.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^3.7.0",
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^22.14.0",
    "@types/ws": "^8.18.1",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^28.1.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "vitest": "^4.0.18",
    "xlsx": "^0.18.5"
  }
}

```

## File: `scripts/cleanup-orphaned-users.mjs`

```javascript
// ===========================================
// VSX: Buy or Bail — Cleanup Orphaned Auth Users
// Run: node scripts/cleanup-orphaned-users.mjs
// ===========================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOrphanedAuthUsers() {
  console.log('🧹 Starting cleanup of orphaned auth users...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers();
    if (authListError) throw authListError;

    console.log(`📋 Found ${authUsers?.users?.length || 0} total auth users`);

    // Get all profile IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    if (profilesError) throw profilesError;

    const profileIds = new Set((profiles || []).map(p => p.id));
    console.log(`📋 Found ${profileIds.size} profiles`);

    // Find orphaned auth users (auth users without profiles)
    const orphanedUsers = (authUsers?.users || []).filter(
      authUser => !profileIds.has(authUser.id)
    );

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned auth users found. Database is clean!');
      return;
    }

    console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned auth users:`);
    orphanedUsers.forEach(user => {
      const email = user.email || 'no-email';
      const username = user.user_metadata?.username || email.split('@')[0];
      console.log(`   - ${username} (${user.id})`);
    });

    console.log('\n🗑️  Deleting orphaned auth users...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          const email = user.email || 'no-email';
          const username = user.user_metadata?.username || email.split('@')[0];
          console.error(`❌ Failed to delete ${username}:`, deleteError.message);
          errorCount++;
        } else {
          const email = user.email || 'no-email';
          const username = user.user_metadata?.username || email.split('@')[0];
          console.log(`✅ Deleted: ${username}`);
          deletedCount++;
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        const email = user.email || 'no-email';
        const username = user.user_metadata?.username || email.split('@')[0];
        console.error(`❌ Error deleting ${username}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Successfully deleted: ${deletedCount} orphaned auth users`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
}

// Check if SERVICE_ROLE_KEY is set
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: You must set your SERVICE_ROLE_KEY!');
  console.error('\n📋 How to get it:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings → API');
  console.error('4. Copy the "service_role" key (secret)');
  console.error('5. Paste it in this script (line 6)\n');
  process.exit(1);
}

cleanupOrphanedAuthUsers();

```

## File: `scripts/convertGraphs.mjs`

```javascript
/**
 * convertGraphs.mjs
 *
 * Reads graph-data.xlsx, extracts Price columns from all 12 sheets,
 * shuffles sheets randomly (Fisher-Yates), maps each to a company symbol,
 * and outputs data/graphData.json.
 *
 * Run once manually: node scripts/convertGraphs.mjs
 * The mapping is permanent until re-run.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const EXCEL_PATH = join(ROOT, "graph-data.xlsx");
const OUTPUT_PATH = join(ROOT, "data", "graphData.json");

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

// Fisher-Yates shuffle (in-place)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function main() {
  console.log("📊 Reading Excel file:", EXCEL_PATH);

  const buf = readFileSync(EXCEL_PATH);
  const workbook = XLSX.read(buf, { type: "buffer" });

  const sheetNames = workbook.SheetNames;
  console.log(`📋 Found ${sheetNames.length} sheets:`, sheetNames);

  if (sheetNames.length !== SYMBOLS.length) {
    throw new Error(
      `Sheet count mismatch! Expected ${SYMBOLS.length} sheets, found ${sheetNames.length}.\n` +
        `Sheets: ${sheetNames.join(", ")}\n` +
        `Symbols: ${SYMBOLS.join(", ")}`,
    );
  }

  // Extract Price arrays from each sheet
  const sheetData = {};
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const prices = [];
    for (const row of rows) {
      const price = row.Price ?? row.price ?? row.PRICE;
      if (price === undefined || price === null || price === "") continue;
      const num = Number(price);
      if (!Number.isFinite(num)) {
        console.warn(`⚠️  Skipping invalid price in sheet "${name}": ${price}`);
        continue;
      }
      prices.push(parseFloat(num.toFixed(4)));
    }

    if (prices.length === 0) {
      throw new Error(`Sheet "${name}" has no valid Price data!`);
    }

    sheetData[name] = prices;
    console.log(
      `  ✅ ${name}: ${prices.length} price points (₹${prices[0]} → ₹${prices[prices.length - 1]})`,
    );
  }

  // Shuffle sheet names and map to symbols
  const shuffledSheetNames = shuffle([...sheetNames]);

  const graphData = {};
  const mapping = [];

  for (let i = 0; i < SYMBOLS.length; i++) {
    const symbol = SYMBOLS[i];
    const sheetName = shuffledSheetNames[i];
    graphData[symbol] = sheetData[sheetName];
    mapping.push({
      symbol,
      sheet: sheetName,
      points: sheetData[sheetName].length,
    });
  }

  // Log mapping clearly
  console.log("\n🔀 Random Sheet → Symbol Mapping:");
  console.log("─".repeat(60));
  for (const m of mapping) {
    console.log(`  ${m.symbol.padEnd(12)} ← ${m.sheet} (${m.points} points)`);
  }
  console.log("─".repeat(60));

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  // Write JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(graphData, null, 2));
  console.log(`\n✅ Successfully wrote ${OUTPUT_PATH}`);
  console.log(
    `   ${SYMBOLS.length} symbols, ${Object.values(graphData).reduce((s, a) => s + a.length, 0)} total data points`,
  );
}

main();

```

## File: `scripts/fix-users.mjs`

```javascript
// Fix auth users for existing profiles
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  { username: 'admin', password: 'admin123' },
  { username: 'aaravsharma', password: 'pass001' },
  { username: 'vivaanpatel', password: 'pass002' },
  { username: 'adityasingh', password: 'pass003' },
  { username: 'vihaankumar', password: 'pass004' },
  { username: 'arjungupta', password: 'pass005' },
  { username: 'reyanshreddy', password: 'pass006' },
  { username: 'saijoshi', password: 'pass007' },
  { username: 'arnavmehta', password: 'pass008' },
  { username: 'dhruvnair', password: 'pass009' },
  { username: 'kabiriyer', password: 'pass010' },
  { username: 'ananyaverma', password: 'pass011' },
  { username: 'diyamalhotra', password: 'pass012' },
  { username: 'myrakapoor', password: 'pass013' },
  { username: 'sarabhat', password: 'pass014' },
  { username: 'aanyarao', password: 'pass015' },
  { username: 'ishasaxena', password: 'pass016' },
  { username: 'kiaradesai', password: 'pass017' },
  { username: 'riyamishra', password: 'pass018' },
  { username: 'priyachopra', password: 'pass019' },
  { username: 'nehabanerjee', password: 'pass020' },
  { username: 'rohandas', password: 'pass021' },
  { username: 'karanpillai', password: 'pass022' },
  { username: 'rahulmenon', password: 'pass023' },
  { username: 'ajaykulkarni', password: 'pass024' },
  { username: 'vikramsrinivasan', password: 'pass025' },
  { username: 'nikhilchoudhury', password: 'pass026' },
  { username: 'amittiwari', password: 'pass027' },
  { username: 'rajagarwal', password: 'pass028' },
  { username: 'devshah', password: 'pass029' },
  { username: 'yashpandey', password: 'pass030' },
  { username: 'snehabose', password: 'pass031' },
  { username: 'poojasen', password: 'pass032' },
  { username: 'nishamukherjee', password: 'pass033' },
  { username: 'kavyachauhan', password: 'pass034' },
  { username: 'tanviyadav', password: 'pass035' },
  { username: 'meerajain', password: 'pass036' },
  { username: 'zarathakur', password: 'pass037' },
  { username: 'aisharanganathan', password: 'pass038' },
  { username: 'simrantrivedi', password: 'pass039' },
  { username: 'divyasaini', password: 'pass040' },
];

async function fixUsers() {
  console.log('🔧 Fixing auth users for existing profiles...\n');

  // First, delete all existing profiles (they have invalid UUIDs)
  console.log('🗑️  Clearing existing profiles...');
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.log('⚠️ Delete profiles error:', deleteError.message);
  } else {
    console.log('✅ Profiles cleared');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of USERS) {
    const email = `${user.username}@vsx.local`;
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true,
        user_metadata: { username: user.username }
      });

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
          console.log(`⏭️  Auth user ${user.username} exists, skipping...`);
          continue;
        }
        throw authError;
      }

      // Get the display name and role from original data
      const isAdmin = user.username === 'admin';
      const displayName = user.username === 'admin' ? 'Administrator' : 
        user.username.replace(/([a-z])([A-Z])/g, '$1 $2')
          .split(/(?=[A-Z])/).join(' ')
          .replace(/^./, c => c.toUpperCase());

      // Create profile with correct auth user ID
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: user.username,
          display_name: displayName,
          role: isAdmin ? 'admin' : 'participant',
          cash_balance: 100000000,
          starting_capital: 100000000,
        });

      if (profileError) {
        console.error(`❌ Profile error for ${user.username}:`, profileError.message);
        await supabase.auth.admin.deleteUser(authData.user.id);
        errorCount++;
        continue;
      }

      console.log(`✅ Created: ${user.username}`);
      successCount++;
      
      await new Promise(r => setTimeout(r, 50));
      
    } catch (err) {
      console.error(`❌ Error with ${user.username}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('========================================\n');

  console.log('📋 Login credentials:');
  console.log('   Admin: admin / admin123');
  console.log('   Users: aaravsharma / pass001, etc.');
}

fixUsers();

```

## File: `scripts/seed-users.mjs`

```javascript
// ===========================================
// VSX: Buy or Bail — Seed Users Script
// Run: node scripts/seed-users.mjs
// ===========================================

import { createClient } from '@supabase/supabase-js';

// You need to get your SERVICE_ROLE key from Supabase Dashboard:
// Project Settings → API → service_role (secret)
const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME'; // ⚠️ REPLACE THIS!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const STARTING_CAPITAL = 100000000; // ₹10 Crore

const USERS = [
  // Admin
  { username: 'admin', displayName: 'Administrator', password: 'admin123', role: 'admin' },
  
  // Participants
  { username: 'aaravsharma', displayName: 'Aarav Sharma', password: 'pass001', role: 'participant' },
  { username: 'vivaanpatel', displayName: 'Vivaan Patel', password: 'pass002', role: 'participant' },
  { username: 'adityasingh', displayName: 'Aditya Singh', password: 'pass003', role: 'participant' },
  { username: 'vihaankumar', displayName: 'Vihaan Kumar', password: 'pass004', role: 'participant' },
  { username: 'arjungupta', displayName: 'Arjun Gupta', password: 'pass005', role: 'participant' },
  { username: 'reyanshreddy', displayName: 'Reyansh Reddy', password: 'pass006', role: 'participant' },
  { username: 'saijoshi', displayName: 'Sai Joshi', password: 'pass007', role: 'participant' },
  { username: 'arnavmehta', displayName: 'Arnav Mehta', password: 'pass008', role: 'participant' },
  { username: 'dhruvnair', displayName: 'Dhruv Nair', password: 'pass009', role: 'participant' },
  { username: 'kabiriyer', displayName: 'Kabir Iyer', password: 'pass010', role: 'participant' },
  { username: 'ananyaverma', displayName: 'Ananya Verma', password: 'pass011', role: 'participant' },
  { username: 'diyamalhotra', displayName: 'Diya Malhotra', password: 'pass012', role: 'participant' },
  { username: 'myrakapoor', displayName: 'Myra Kapoor', password: 'pass013', role: 'participant' },
  { username: 'sarabhat', displayName: 'Sara Bhat', password: 'pass014', role: 'participant' },
  { username: 'aanyarao', displayName: 'Aanya Rao', password: 'pass015', role: 'participant' },
  { username: 'ishasaxena', displayName: 'Isha Saxena', password: 'pass016', role: 'participant' },
  { username: 'kiaradesai', displayName: 'Kiara Desai', password: 'pass017', role: 'participant' },
  { username: 'riyamishra', displayName: 'Riya Mishra', password: 'pass018', role: 'participant' },
  { username: 'priyachopra', displayName: 'Priya Chopra', password: 'pass019', role: 'participant' },
  { username: 'nehabanerjee', displayName: 'Neha Banerjee', password: 'pass020', role: 'participant' },
  { username: 'rohandas', displayName: 'Rohan Das', password: 'pass021', role: 'participant' },
  { username: 'karanpillai', displayName: 'Karan Pillai', password: 'pass022', role: 'participant' },
  { username: 'rahulmenon', displayName: 'Rahul Menon', password: 'pass023', role: 'participant' },
  { username: 'ajaykulkarni', displayName: 'Ajay Kulkarni', password: 'pass024', role: 'participant' },
  { username: 'vikramsrinivasan', displayName: 'Vikram Srinivasan', password: 'pass025', role: 'participant' },
  { username: 'nikhilchoudhury', displayName: 'Nikhil Choudhury', password: 'pass026', role: 'participant' },
  { username: 'amittiwari', displayName: 'Amit Tiwari', password: 'pass027', role: 'participant' },
  { username: 'rajagarwal', displayName: 'Raj Agarwal', password: 'pass028', role: 'participant' },
  { username: 'devshah', displayName: 'Dev Shah', password: 'pass029', role: 'participant' },
  { username: 'yashpandey', displayName: 'Yash Pandey', password: 'pass030', role: 'participant' },
  { username: 'snehabose', displayName: 'Sneha Bose', password: 'pass031', role: 'participant' },
  { username: 'poojasen', displayName: 'Pooja Sen', password: 'pass032', role: 'participant' },
  { username: 'nishamukherjee', displayName: 'Nisha Mukherjee', password: 'pass033', role: 'participant' },
  { username: 'kavyachauhan', displayName: 'Kavya Chauhan', password: 'pass034', role: 'participant' },
  { username: 'tanviyadav', displayName: 'Tanvi Yadav', password: 'pass035', role: 'participant' },
  { username: 'meerajain', displayName: 'Meera Jain', password: 'pass036', role: 'participant' },
  { username: 'zarathakur', displayName: 'Zara Thakur', password: 'pass037', role: 'participant' },
  { username: 'aisharanganathan', displayName: 'Aisha Ranganathan', password: 'pass038', role: 'participant' },
  { username: 'simrantrivedi', displayName: 'Simran Trivedi', password: 'pass039', role: 'participant' },
  { username: 'divyasaini', displayName: 'Divya Saini', password: 'pass040', role: 'participant' },
];

async function seedUsers() {
  console.log('🚀 Starting user seeding...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of USERS) {
    const email = `${user.username}@vsx.local`;
    
    try {
      // Check if profile already exists (more reliable than checking auth)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', user.username)
        .single();

      if (existingProfile) {
        console.log(`⏭️  User ${user.username} already exists, skipping...`);
        skipCount++;
        continue;
      }

      // Create auth user using Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          username: user.username,
          display_name: user.displayName,
        }
      });

      if (authError) {
        // Check for duplicate email error
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
          console.log(`⏭️  User ${user.username} already registered, skipping...`);
          skipCount++;
          continue;
        }
        throw authError;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: user.username,
          display_name: user.displayName,
          role: user.role,
          cash_balance: STARTING_CAPITAL,
          starting_capital: STARTING_CAPITAL,
        });

      if (profileError) {
        console.error(`❌ Profile error for ${user.username}:`, profileError.message);
        // Try to clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        errorCount++;
        continue;
      }

      console.log(`✅ Created: ${user.username} (${user.role})`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
      
    } catch (err) {
      console.error(`❌ Error creating ${user.username}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`⏭️  Skipped (existing): ${skipCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('========================================\n');
}

// Check if SERVICE_ROLE_KEY is set
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: You must set your SERVICE_ROLE_KEY!');
  console.error('\n📋 How to get it:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings → API');
  console.error('4. Copy the "service_role" key (secret)');
  console.error('5. Paste it in this script (line 11)\n');
  process.exit(1);
}

seedUsers();

```

## File: `scripts/test-supabase.mjs`

```javascript
// Test Supabase connection and auth
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check database connection
  console.log('1️⃣ Testing database connection...');
  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (dbError) {
    console.log('❌ Database error:', dbError.message);
    console.log('\n👉 You may need to run sql/schema.sql first in Supabase SQL Editor');
  } else {
    console.log('✅ Database connection OK');
  }

  // Test 2: List existing users
  console.log('\n2️⃣ Listing existing auth users...');
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Auth error:', authError.message);
    console.log('\n⚠️ This might indicate:');
    console.log('   - Project is paused (free tier)');
    console.log('   - Service role key is invalid');
    console.log('   - Auth service has issues');
  } else {
    console.log(`✅ Found ${users.users.length} existing users:`);
    users.users.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`);
    });
  }

  // Test 3: Try creating a single test user
  console.log('\n3️⃣ Attempting to create a test user...');
  const testEmail = `test_${Date.now()}@vsx.local`;
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'testpass123',
    email_confirm: true
  });

  if (createError) {
    console.log('❌ Create user error:', createError.message);
    console.log('\nFull error:', JSON.stringify(createError, null, 2));
  } else {
    console.log('✅ Successfully created test user:', newUser.user.email);
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(newUser.user.id);
    console.log('🧹 Cleaned up test user');
  }

  console.log('\n========================================');
  console.log('Test complete!');
}

test();

```

## File: `sql/README.md`

```markdown
# SQL Files

All Supabase SQL files for the **VSX: Buy or Bail** stock simulation platform.

## Files

| File         | Description                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.sql` | Complete database schema — tables, RLS policies, seed data, triggers, and realtime config. Run this in the Supabase SQL Editor to set up everything. |

## Usage

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Paste the contents of `schema.sql`
3. Click **Run**

```

## File: `sql/enable-realtime.sql`

```sql
-- ===========================================
-- Enable Realtime for news_events and market_items
-- Run this AFTER schema.sql if realtime isn't working
-- ===========================================

-- Set REPLICA IDENTITY FULL so Realtime sends all columns
alter table news_events replica identity full;
alter table market_items replica identity full;

-- Re-add to realtime publication (safe to run multiple times)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'news_events'
  ) then
    alter publication supabase_realtime add table news_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'market_items'
  ) then
    alter publication supabase_realtime add table market_items;
  end if;
end $$;

```

## File: `sql/reset-auction.sql`

```sql
-- ===========================================
-- VSX: Buy or Bail — Reset Auction
-- Resets all participant balances, clears portfolios and transactions
-- ===========================================

-- Reset all participant cash balances to starting capital
UPDATE profiles 
SET cash_balance = 100000, starting_capital = 100000 
WHERE role = 'participant';

-- Clear all portfolios
DELETE FROM portfolios;

-- Clear all transactions
DELETE FROM transactions;

-- Deactivate all news events
UPDATE news_events SET active = false;

-- Reset market prices to initial values
UPDATE market_items SET 
  price = CASE symbol
    WHEN 'VELOCITY' THEN 1250.00
    WHEN 'APEXAUTO' THEN 850.00
    WHEN 'CRUISER' THEN 2150.00
    WHEN 'VITALIS' THEN 1650.00
    WHEN 'CAREPLUS' THEN 3400.00
    WHEN 'MEDISURG' THEN 920.00
    WHEN 'EDUNEXT' THEN 540.00
    WHEN 'SCHOLAR' THEN 890.00
    WHEN 'BRAINB' THEN 1120.00
    WHEN 'FRESHC' THEN 430.00
    WHEN 'SPICER' THEN 1750.00
    WHEN 'URBANB' THEN 220.00
    ELSE price
  END,
  change = 0,
  sentiment = 'Neutral',
  price_history = '[]';

SELECT 'Auction reset complete!' as status;

```

## File: `sql/schema.sql`

```sql
-- ===========================================
-- VSX: Buy or Bail — Supabase Schema
-- Safe to re-run (idempotent)
-- ===========================================

-- ─── Profiles ───
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'participant' check (role in ('admin', 'participant')),
  cash_balance numeric not null default 100000,
  starting_capital numeric not null default 100000,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Anyone can read profiles" on profiles;
create policy "Anyone can read profiles"
  on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─── Market Items ───
create table if not exists market_items (
  symbol text primary key,
  name text not null,
  price numeric not null,
  change numeric not null default 0,
  sentiment text not null default 'Neutral',
  sector text not null,
  icon text not null default '',
  price_history jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table market_items enable row level security;

drop policy if exists "Anyone can read market" on market_items;
create policy "Anyone can read market"
  on market_items for select using (true);

drop policy if exists "Admins can update market" on market_items;
create policy "Admins can update market"
  on market_items for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── News Events ───
create table if not exists news_events (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  crash_company text not null,
  crash_percent numeric not null,
  boost_companies text[] not null default '{}',
  boost_percent numeric not null,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table news_events enable row level security;

drop policy if exists "Anyone can read news" on news_events;
create policy "Anyone can read news"
  on news_events for select using (true);

drop policy if exists "Admins can insert news" on news_events;
create policy "Admins can insert news"
  on news_events for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can update news" on news_events;
create policy "Admins can update news"
  on news_events for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Portfolios ───
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  amount integer not null default 0,
  avg_price numeric not null default 0,
  unique(user_id, symbol)
);

alter table portfolios enable row level security;

drop policy if exists "Users can read own portfolio" on portfolios;
create policy "Users can read own portfolio"
  on portfolios for select using (auth.uid() = user_id);

drop policy if exists "Users can insert portfolio" on portfolios;
create policy "Users can insert portfolio"
  on portfolios for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own portfolio" on portfolios;
create policy "Users can update own portfolio"
  on portfolios for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own portfolio" on portfolios;
create policy "Users can delete own portfolio"
  on portfolios for delete using (auth.uid() = user_id);

-- ─── Transactions ───
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  asset_name text not null,
  type text not null check (type in ('BUY', 'SELL')),
  quantity integer not null,
  price numeric not null,
  purchase_price numeric,
  profit_loss numeric,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

drop policy if exists "Users can read own transactions" on transactions;
create policy "Users can read own transactions"
  on transactions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert transactions" on transactions;
create policy "Users can insert transactions"
  on transactions for insert with check (auth.uid() = user_id);

-- ─── Add sector column if missing (for existing databases) ───
alter table market_items add column if not exists sector text not null default 'Unknown';

-- ─── Seed Market Data ───
delete from market_items;

insert into market_items (symbol, name, price, sentiment, sector, icon) values
  -- Automobile Sector
  ('VELOCITY', 'Velocity Auto', 1250.00, 'Bullish', 'Automobile', 'V'),
  ('APEXAUTO', 'Apex Automotive', 850.00, 'Neutral', 'Automobile', 'A'),
  ('CRUISER', 'Cruiser Dynamics', 2150.00, 'Bullish', 'Automobile', 'C'),

  -- Health Sector
  ('VITALIS', 'Vitalis Health', 1650.00, 'Bullish', 'Health', 'V'),
  ('CAREPLUS', 'CarePlus Hospitals', 3400.00, 'Neutral', 'Health', 'C'),
  ('MEDISURG', 'Medisurge Pharma', 920.00, 'Bearish', 'Health', 'M'),

  -- EdTech Sector
  ('EDUNEXT', 'EduNext', 540.00, 'Neutral', 'EdTech', 'E'),
  ('SCHOLAR', 'ScholarStream', 890.00, 'Bullish', 'EdTech', 'S'),
  ('BRAINB', 'BrainBoost', 1120.00, 'Bearish', 'EdTech', 'B'),

  -- Food Sector
  ('FRESHC', 'FreshCrave Foods', 430.00, 'Neutral', 'Food', 'F'),
  ('SPICER', 'SpiceRoute Dining', 1750.00, 'Bullish', 'Food', 'S'),
  ('URBANB', 'UrbanBites', 220.00, 'Bullish', 'Food', 'U')
on conflict (symbol) do nothing;

-- ─── Auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile already exists before inserting
  -- This prevents duplicate profile creation if trigger fires unexpectedly
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, username, display_name, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'role', 'participant')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Enable Realtime ───
alter table news_events replica identity full;
alter table market_items replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'news_events'
  ) then
    alter publication supabase_realtime add table news_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'market_items'
  ) then
    alter publication supabase_realtime add table market_items;
  end if;
end $$;

```

## File: `sql/update-starting-capital.sql`

```sql
-- ===========================================
-- VSX: Buy or Bail — Update Starting Capital
-- Changes starting capital from ₹10 Crore to ₹1 Lakh (100,000)
-- Run this in Supabase SQL Editor
-- ===========================================

-- Update all profiles to new starting capital
UPDATE profiles 
SET cash_balance = 100000, starting_capital = 100000;

-- Update default value in schema (for new users)
ALTER TABLE profiles ALTER COLUMN cash_balance SET DEFAULT 100000;
ALTER TABLE profiles ALTER COLUMN starting_capital SET DEFAULT 100000;

SELECT 'Updated ' || count(*) || ' profiles to ₹1 Lakh starting capital' as status FROM profiles;

```

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}

```

## File: `types.ts`

```typescript
export interface StockDataPoint {
  time: string;
  value: number;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  change: number;
  history: { value: number }[];
}

export interface MarketItem {
  name: string;
  symbol: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sector: string;
  icon: string;
  priceHistory: StockDataPoint[];
}

export interface PortfolioItem {
  asset: string;
  symbol: string;
  amount: number;
  avgPrice: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  assetName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchasePrice?: number;
  timestamp: number;
  profitLoss?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  startingCapital: number;
  cashBalance: number;
  portfolio: PortfolioItem[];
  transactions: Transaction[];
}

export interface NewsEvent {
  id: string;
  headline: string;
  crashCompany: string;
  crashPercent: number;
  boostCompanies: string[];
  boostPercent: number;
  timestamp: number;
  active: boolean;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
}
```

## File: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}

```

## File: `vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

```

## File: `vite.config.ts`

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunk splitting by package
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
                return 'recharts';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('lucide-react')) {
                return 'lucide';
              }
              // All other vendor libs (react, react-dom, etc.)
              return 'vendor';
            }
          },
        },
      },
    },
  };
});

```

## File: `ws-server.ts`

```typescript
import { WebSocketServer } from 'ws';

const PORT = 4000;
const wss = new WebSocketServer({ port: PORT });

console.log(`🔌 WebSocket sync server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log(`✅ Client connected (total: ${wss.clients.size})`);

  ws.on('message', (raw) => {
    const msg = raw.toString();
    // Broadcast to ALL other connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected (total: ${wss.clients.size})`);
  });
});

```

