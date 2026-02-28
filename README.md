# 📈 VSX: Buy or Bail

**VSX: Buy or Bail** is a real-time virtual stock market simulation built for the **NOESIS Tech Fest**, hosted by **Vedam School of Technology**.

---

## 🎯 About the Event

"Buy or Bail" is an engaging, fast-paced financial simulation where students experience the adrenaline of a live trading floor. Participants start with a virtual balance of ₹1,00,000 and must use their financial acumen to trade stocks across various sectors.

The catch? The market isn't just driven by random price fluctuations. Throughout the event, breaking news flashes are announced that instantly crash certain companies while boosting their competitors. Participants must stay on their toes—analyzing the news, predicting market reactions, and deciding whether to "Buy" the dip, or "Bail" before they lose their investment. The participant with the highest total net worth at the end of the simulation wins.

---

## 💻 About the Website & Flow of Events

The VSX platform provides a complete real-time trading ecosystem with two distinct experiences: one for the participants trading in the market, and one for the administrators controlling the simulation.

### 🧑‍💼 Participant Flow

1. **Onboarding:** Participants log in to their dashboard and are greeted with a starting balance of ₹1,00,000.
2. **Market Overview:** They can navigate through the **Overview**, **Markets**, and **Portfolio** tabs. The dashboard displays the live prices of 12 fictional companies, updating every 5 seconds.
3. **Execution (Trading):**
   - Participants analyze stock charts (with full-screen detail views available for deep-dives).
   - They execute **BUY** or **SELL** orders seamlessly through a custom Trade Modal, which supports quick-select percentages (25%, 50%, Max).
   - Their Portfolio dynamically tracks their holdings, average buy prices, and real-time Profit/Loss.
4. **Reacting to News (The Twist):**
   - Periodically, the screen will flash with a **Breaking News Alert** (e.g., a CEO stepping down or a massive security breach).
   - A red banner appears across the screen, detailing which company is crashing (e.g., -15%) and which competitors are boosting.
   - A 15-minute countdown begins. Participants must rapidly execute trades to capitalize on the new market conditions before the news flash expires and prices normalize.
5. **Endgame:** Once the simulation time limit is reached, the market closes. Trading is disabled, and final net worths are calculated to determine the winner.

### 👑 Admin Flow

1. **Control Center:** The Admin logs into a protected dashboard to oversee the entire event.
2. **Simulation Management:**
   - The Admin has master controls to **Start**, **Pause**, or **Reset** the market simulation.
   - The Admin can jump the simulation time forward to skip quiet periods.
3. **Triggering Events:**
   - The Admin has a pre-scheduled timeline of major news events. As the simulation clock ticks, the system automatically triggers these events.
   - The Admin can also manually trigger spontaneous news flashes by selecting a company to crash, setting the crash percentage, and selecting rival companies to boost.
4. **Monitoring:** A live leaderboard constantly tracks all participants' net worths, allowing the Admin to see who is currently winning without refreshing the page.
5. **Resetting:** At the end of a round, the Admin can click "Reset Auction" to instantly wipe all participant portfolios and reset cash balances back to ₹1,00,000 for the next batch of players.

---

## ✨ Technical Features

- **Real-time Price Engine:** Client-side price ticking with sentiment-based volatility metrics.
- **Supabase Realtime Sync:** Instant push updates for admin-triggered events using PostgreSQL WebSockets.
- **Dynamic UI:** Built with React 19 and Tailwind CSS, featuring pulsing status indicators, real-time charts via Recharts, and immersive breaking news banners.
- **Authentication:** Secure email/password login integrated with Supabase Auth.

---

## 🏗️ Tech Stack

| Layer                   | Technology                              |
| ----------------------- | --------------------------------------- |
| **Framework**           | React 19                                |
| **Language**            | TypeScript                              |
| **Build Tool**          | Vite 6                                  |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + Realtime) |
| **Charting**            | Recharts                                |
| **Styling**             | Tailwind CSS                            |
| **Deployment**          | Vercel                                  |

---

## � Project Structure

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

## �🚀 Getting Started

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

## 🏛️ Event Details

|               |                            |
| ------------- | -------------------------- |
| **Event**     | VSX: Buy or Bail           |
| **Tech Fest** | NOESIS                     |
| **Hosted By** | Vedam School of Technology |

---

## 📄 License

This project is private and built for the NOESIS Tech Fest event.
