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
  Play,
  Pause,
  Square,
  Timer,
  Clock,
  SkipForward,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StockChart, MiniSparkline } from "../dashboard/Charts";
import { AdminUsers } from "./AdminUsers";
import { graphData } from "../../data/graphData";
import type { StockDataPoint } from "../../types";
import type { Profile } from "../auth/AuthProvider";
import type { MarketItem, SimState } from "../../hooks/useMarket";
import type { NewsEvent } from "../../hooks/useNews";
import { SCHEDULED_NEWS } from "../../data/scheduledNews";
import { supabase } from "../../lib/supabaseClient";

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
  simState: SimState;
  elapsedSeconds: number;
  onStartSim: () => void;
  onPauseSim: () => void;
  onResetSim: () => void;
  onSkipTo: (tick: number) => void;
}

const TOTAL_EVENT_SECONDS = 7200; // 2 hours

/** Format seconds as HH:MM:SS */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  simState,
  elapsedSeconds,
  onStartSim,
  onPauseSim,
  onResetSim,
  onSkipTo,
}) => {
  const [activeView, setActiveView] = useState<"charts" | "news" | "users">(
    "news",
  );
  
  // Top Participant fetching
  const [topParticipant, setTopParticipant] = useState<{name: string, netWorth: number} | null>(null);
  const priceMapRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    const m: Record<string, number> = {};
    marketItems.forEach(item => { m[item.symbol] = item.price; });
    priceMapRef.current = m;
  }, [marketItems]);

  useEffect(() => {
    let mounted = true;
    const fetchTopParticipant = async () => {
      try {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, display_name, cash_balance')
          .eq('role', 'participant');
        if (pErr) return;

        const { data: portfolios, error: portErr } = await supabase
          .from('portfolios')
          .select('user_id, symbol, amount, avg_price');
        if (portErr) return;

        const portfolioByUser: Record<string, any[]> = {};
        (portfolios || []).forEach((row: any) => {
          if (!portfolioByUser[row.user_id]) portfolioByUser[row.user_id] = [];
          portfolioByUser[row.user_id].push(row);
        });

        const pm = priceMapRef.current;
        let topUser = null;
        let maxNetWorth = -Infinity;

        (profiles || []).forEach((p: any) => {
          const holdings = portfolioByUser[p.id] || [];
          const stockValue = holdings.reduce((sum, h) => {
            return sum + h.amount * (pm[h.symbol] ?? h.avg_price);
          }, 0);
          const netWorth = stockValue + p.cash_balance;
          
          if (netWorth > maxNetWorth) {
            maxNetWorth = netWorth;
            topUser = { name: p.display_name, netWorth };
          }
        });

        if (mounted && topUser) {
          setTopParticipant(topUser);
        }
      } catch (e) {
        // Silently fail
      }
    };

    fetchTopParticipant();
    const interval = setInterval(fetchTopParticipant, 5000); // refresh every 5s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  const [selectedChart, setSelectedChart] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Sim reset confirm
  const [simResetConfirm, setSimResetConfirm] = useState(false);
  const [skipMinutes, setSkipMinutes] = useState('');

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

        {/* ─── Simulation Control Bar ─── */}
        <Card className="bg-gradient-to-r from-surface via-surfaceElevated to-surface mb-8 border-primary/20">
          <div className="flex flex-col gap-4">
            {/* Top row: status + timer + controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Status badge + timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-textMuted uppercase tracking-wider">Event Timer</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    simState === 'running'
                      ? 'bg-primary/15 text-primary border border-primary/30 animate-pulse'
                      : simState === 'paused'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-surface text-textMuted border border-border'
                  }`}
                >
                  {simState === 'running' ? '● Live' : simState === 'paused' ? '⏸ Paused' : '○ Idle'}
                </span>
              </div>

              {/* Timer display */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold tracking-wider text-textMain">
                    {formatTime(elapsedSeconds)}
                  </div>
                  <div className="text-xs text-textMuted mt-0.5 flex items-center gap-1 justify-center">
                    <Clock className="w-3 h-3" />
                    {formatTime(Math.max(0, TOTAL_EVENT_SECONDS - elapsedSeconds))} remaining
                  </div>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                {simState === 'idle' && (
                  <button
                    onClick={onStartSim}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-primary to-emerald-500 text-white hover:from-primary/90 hover:to-emerald-500/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                    Start Event
                  </button>
                )}
                {simState === 'running' && (
                  <button
                    onClick={onPauseSim}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-500/90 hover:to-orange-500/90 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                {simState === 'paused' && (
                  <button
                    onClick={onStartSim}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-primary to-emerald-500 text-white hover:from-primary/90 hover:to-emerald-500/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                {(simState === 'running' || simState === 'paused') && (
                  <>
                    {simResetConfirm ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onResetSim();
                            setSimResetConfirm(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-all"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Confirm Reset
                        </button>
                        <button
                          onClick={() => setSimResetConfirm(false)}
                          className="px-3 py-2.5 text-sm text-textMuted hover:text-textMain transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSimResetConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Square className="w-4 h-4" />
                        Stop & Reset
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Skip-to controls (admin testing) */}
            {simState !== 'idle' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <SkipForward className="w-4 h-4 text-textMuted" />
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Skip to:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: '29m', tick: 1740, desc: 'Before Flash 1' },
                    { label: '30m', tick: 1800, desc: 'Flash 1' },
                    { label: '59m', tick: 3540, desc: 'Before Flash 2' },
                    { label: '1h', tick: 3600, desc: 'Flash 2' },
                    { label: '89m', tick: 5340, desc: 'Before Flash 3' },
                    { label: '1h30', tick: 5400, desc: 'Flash 3' },
                  ].map((preset) => (
                    <button
                      key={preset.tick}
                      onClick={() => onSkipTo(preset.tick)}
                      title={preset.desc}
                      className="px-2.5 py-1 rounded text-xs font-bold bg-surfaceElevated border border-border text-textMuted hover:text-textMain hover:border-primary/40 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="min"
                    min={0}
                    max={120}
                    value={skipMinutes}
                    onChange={(e) => setSkipMinutes(e.target.value)}
                    className="w-16 bg-surface border border-border rounded px-2 py-1 text-xs text-textMain focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => {
                      const mins = parseInt(skipMinutes);
                      if (!isNaN(mins) && mins >= 0) {
                        onSkipTo(mins * 60);
                        setSkipMinutes('');
                      }
                    }}
                    className="px-2.5 py-1 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
                  >
                    Go
                  </button>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full">
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    simState === 'running'
                      ? 'bg-gradient-to-r from-primary to-emerald-400'
                      : simState === 'paused'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-border'
                  }`}
                  style={{ width: `${Math.min(100, (elapsedSeconds / TOTAL_EVENT_SECONDS) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-textMuted mt-1">
                <span>0:00</span>
                <span>0:30</span>
                <span>1:00</span>
                <span>1:30</span>
                <span>2:00</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Scheduled Events Timeline ─── */}
        {simState !== 'idle' && (
          <Card className="mb-8 bg-surface/50">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-textMuted uppercase tracking-wider">Scheduled News Flashes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCHEDULED_NEWS.map((sched) => {
                const triggerMin = Math.floor(sched.triggerTick / 60);
                const stopTick = sched.triggerTick + sched.durationTicks;
                const isActive = elapsedSeconds >= sched.triggerTick && elapsedSeconds < stopTick;
                const isCompleted = elapsedSeconds >= stopTick;
                const isUpcoming = elapsedSeconds < sched.triggerTick;

                return (
                  <div
                    key={sched.triggerTick}
                    className={`rounded-lg p-3 border transition-all ${
                      isActive
                        ? 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/5'
                        : isCompleted
                          ? 'bg-surfaceElevated border-border opacity-60'
                          : 'bg-surfaceElevated border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-textMuted">
                        {triggerMin >= 60 ? `${Math.floor(triggerMin / 60)}h ${triggerMin % 60}m` : `${triggerMin}m`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-orange-500/20 text-orange-400 animate-pulse'
                            : isCompleted
                              ? 'bg-surface text-textMuted'
                              : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isActive ? '● Active' : isCompleted ? '✓ Done' : '○ Upcoming'}
                      </span>
                    </div>
                    <div className="text-xs text-textMuted mb-1">{sched.sector}</div>
                    <div className="text-sm font-semibold text-textMain truncate mb-1">
                      {sched.headline.split(':').slice(1).join(':').trim()}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-negative/10 text-negative rounded text-xs font-semibold">
                        <TrendingDown className="w-3 h-3" />
                        {sched.crashCompany} {sched.crashPercent}%
                      </span>
                      {sched.boostCompanies.map((sym) => (
                        <span
                          key={sym}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold"
                        >
                          <TrendingUp className="w-3 h-3" />
                          {sym} +{sched.boostPercent}%
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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
            className="bg-gradient-to-br from-surface to-surfaceElevated cursor-pointer hover:border-primary/40 transition-colors relative overflow-hidden"
            onClick={() => setActiveView("users")}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-textMuted text-yellow-500/80 font-semibold tracking-wider uppercase">Top Participant</span>
            </div>
            {topParticipant ? (
              <div className="flex flex-col">
                <div className="text-2xl font-bold truncate pr-12">{topParticipant.name}</div>
                <div className="text-sm font-mono text-primary flex items-center gap-1 mt-1">
                  ₹{topParticipant.netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Net Worth
                </div>
              </div>
            ) : (
              <div className="text-xl text-textMuted">--</div>
            )}
            <div className="absolute bottom-4 right-4 text-blue-400/50">→</div>
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
