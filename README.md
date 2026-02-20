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
