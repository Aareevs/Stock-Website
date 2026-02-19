import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Card } from '../ui/Card';
import { MainChart, MiniSparkline, SentimentChart } from './Charts';
import { METRICS, SENTIMENT_DATA, generateChartData } from '../../constants';
import { ArrowUpRight, ArrowDownRight, Newspaper, LogIn, LogOut as LogOutIcon, User as UserIcon, History, TrendingUp, TrendingDown, Zap, Trophy, X, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { TradeModal } from './TradeModal';
import { StockDetailChart } from './StockDetailChart';
import type { Profile } from '../auth/AuthProvider';
import type { MarketItem } from '../../hooks/useMarket';
import type { NewsEvent } from '../../hooks/useNews';
import type { PortfolioItem, Transaction } from '../../hooks/usePortfolio';

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
    type: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    currentBalance: number,
    purchasePrice?: number
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
  const [activeTab, setActiveTab] = useState('Overview');
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

  const handleConfirmTrade = async (type: 'buy' | 'sell', quantity: number) => {
    if (!selectedAsset) return;

    const existing = portfolio.find(p => p.symbol === selectedAsset.symbol);
    const result = await onExecuteTrade(
      profile.id,
      selectedAsset.symbol,
      selectedAsset.name,
      type === 'buy' ? 'BUY' : 'SELL',
      quantity,
      selectedAsset.price,
      balance,
      existing?.avg_price
    );

    if (!result.error) {
      setTradeModalOpen(false);
      // Refresh profile to update cash balance
      await onRefreshProfile();
    }
  };

  // Portfolio value
  const totalPortfolioValueCalc = portfolio.reduce((acc, item) => {
    const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price ?? 0;
    return acc + ((item.amount ?? 0) * currentPrice);
  }, 0);

  // If viewing a stock detail chart
  if (selectedStock) {
    return (
      <div className="flex min-h-screen bg-background text-textMain">
        <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setSelectedStock(null); setActiveTab(tab); }} onOpenAdmin={onOpenAdmin} currentUserName={profile.display_name} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
          <StockDetailChart
            stock={selectedStock}
            onBack={() => setSelectedStock(null)}
            ownedQty={portfolio.find(p => p.symbol === selectedStock.symbol)?.amount || 0}
            avgPrice={portfolio.find(p => p.symbol === selectedStock.symbol)?.avg_price || 0}
            onTrade={() => handleOpenTrade(selectedStock)}
          />
        </main>
      </div>
    );
  }

  const renderOverview = () => {
    const totalPortfolioValue = portfolio.reduce((acc, item) => {
      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price ?? 0;
      return acc + ((item.amount ?? 0) * currentPrice);
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    return (
      <>
        {/* Balance Header */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <span className="text-sm text-textMuted block mb-1">Total Net Worth</span>
            <span className="text-4xl md:text-5xl font-bold text-textMain">
              ₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <h3 className="text-sm text-textMuted mb-1">Cash Balance</h3>
            <div className="text-2xl font-bold font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <h3 className="text-sm text-textMuted mb-1">Stock Value</h3>
            <div className="text-2xl font-bold font-mono">₹{totalPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <h3 className="text-sm text-textMuted mb-1">P&L</h3>
            <div className={`text-2xl font-bold font-mono ${totalNetWorth - startingCapital >= 0 ? 'text-primary' : 'text-negative'}`}> 
              {totalNetWorth - startingCapital >= 0 ? '+' : ''}₹{(totalNetWorth - startingCapital).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
                  <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-textMain">{item.name}</div>
                    <div className="text-xs text-textMuted">{item.symbol}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono font-bold text-lg">₹{(item.price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${(item.change ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}> {(item.change ?? 0) >= 0 ? '+' : ''}{(item.change ?? 0).toFixed(2)}%</span>
                </div>
                <div style={{ background: '#222', borderRadius: '8px', border: '1px solid #333', padding: '2px' }}>
                  <MiniSparkline 
                    data={((item.priceHistory && item.priceHistory.length > 0) ? item.priceHistory.slice(-20) : [
                      { value: item.price ?? 0 }, { value: item.price ?? 0 }, { value: item.price ?? 0 }
                    ])}
                    color={(item.change ?? 0) >= 0 ? '#1ED3A6' : '#EF4444'}
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
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live
          </div>
          <div className="text-primary text-sm flex items-center gap-1">Prices update every 5s</div>
        </Card>
        <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
          <h3 className="text-sm text-textMuted mb-2">Your Purchasing Power</h3>
          <div className="text-2xl font-bold mb-1 font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-textMuted text-sm flex items-center gap-1">Available to trade</div>
        </Card>
        <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
          <h3 className="text-sm text-textMuted mb-2">Total Stocks</h3>
          <div className="text-2xl font-bold mb-1">{marketItems.length}</div>
          <div className="text-primary text-sm flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Active</div>
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
                const owned = portfolio.find(p => p.symbol === item.symbol);
                return (
                  <tr key={item.symbol} className="border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors group">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedStock(item)}>
                        <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-primary transition-transform group-hover:scale-110">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-textMain">{item.name}</div>
                          <div className="text-xs text-textMuted">{item.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-medium">₹{(item.price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1 ${(item.change ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {(item.change ?? 0) >= 0 ? '+' : ''}{(item.change ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 font-mono text-textMuted">
                      {owned ? `₹${(owned.avg_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-4 w-32">
                      <MiniSparkline data={(item.priceHistory || []).slice(-20)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
                    </td>
                    <td className="py-4">
                      <Button size="sm" onClick={() => handleOpenTrade(item)} className="opacity-0 group-hover:opacity-100 transition-opacity">Trade</Button>
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
      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price ?? 0;
      return acc + ((item.amount ?? 0) * currentPrice);
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="relative z-10">
              <h3 className="text-sm text-textMuted mb-2">Total Net Worth</h3>
              <div className="text-4xl font-bold mb-4 font-mono">₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="flex gap-4">
                <div className="px-3 py-1 bg-surface/50 rounded border border-border">
                  <span className="text-xs text-textMuted block">Cash Balance</span>
                  <span className="font-mono">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-3 py-1 bg-surface/50 rounded border border-border">
                  <span className="text-xs text-textMuted block">Stock Value</span>
                  <span className="font-mono">₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold mb-2">Allocation</h3>
            <div className="h-32">
              {portfolio.length > 0 ? (
                <SentimentChart data={portfolio.map((i, idx) => ({ name: i.symbol, value: (i.amount ?? 0) * (marketItems.find(m => m.symbol === i.symbol)?.price ?? 0), color: ['#1ED3A6', '#14B8A6', '#0D9488', '#0F766E', '#10B981', '#34D399'][idx % 6] }))} />
              ) : (
                <div className="h-full flex items-center justify-center text-textMuted text-xs">No assets owned</div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Your Holdings</h3>
          {portfolio.length === 0 ? (
            <div className="text-center py-12 text-textMuted">
              <p className="mb-4">You don't own any stocks yet.</p>
              <Button onClick={() => setActiveTab('Markets')}>Go to Markets</Button>
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
                    const marketData = marketItems.find(m => m.symbol === item.symbol);
                    const currentPrice = marketData?.price ?? 0;
                    const amount = item.amount ?? 0;
                    const avgPrice = item.avg_price ?? 0;
                    const totalValue = amount * currentPrice;
                    const pnl = (currentPrice - avgPrice) * amount;
                    return (
                      <tr key={item.symbol} className="border-b border-border/50">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-textMain">
                              {item.symbol?.[0] ?? '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-textMain">{marketItems.find(m => m.symbol === item.symbol)?.name || item.symbol}</div>
                              <div className="text-xs text-textMuted">{item.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono">{amount.toFixed(2)}</td>
                        <td className="py-4 font-mono text-textMuted">₹{avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 font-mono">₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-4 font-mono font-bold ${pnl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 font-bold font-mono text-textMain">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right pr-2">
                          <Button size="sm" variant="secondary" onClick={() => handleOpenTrade(marketData!)}>Trade</Button>
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-negative/20 text-negative'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">{tx.symbol}</td>
                      <td className="py-3 font-mono">{(tx.quantity ?? 0).toFixed(2)}</td>
                      <td className="py-3 font-mono">₹{(tx.price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 font-mono text-textMuted">
                        {tx.purchase_price != null ? `₹${tx.purchase_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className={`py-3 font-mono font-bold ${(tx.profit_loss ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profit_loss != null ? `${tx.profit_loss >= 0 ? '+' : ''}₹${tx.profit_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3 text-right pr-2 text-textMuted text-xs">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'}
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
    const activeEvent = newsEvents.find(e => e.active);
    const pastEvents = newsEvents.filter(e => !e.active);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Market News</h2>
            <p className="text-textMuted text-sm">Breaking stories & events shaping the market</p>
          </div>
        </div>

        {/* Active Flash — Featured Blog Post */}
        {activeEvent && (() => {
          const crashCompany = marketItems.find(m => m.symbol === activeEvent.crash_company);
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
                    {new Date(activeEvent.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-orange-400 mb-3 leading-tight">{activeEvent.headline}</h2>
                <p className="text-sm text-textMuted mb-5 leading-relaxed max-w-2xl">
                  Markets are reacting to breaking developments. {crashCompany?.name || activeEvent.crash_company} shares have plummeted
                  by {Math.abs(activeEvent.crash_percent)}% as investors rush to exit positions.
                  {activeEvent.boost_companies.length > 0 && ` Meanwhile, competitors are seeing gains as capital flows into alternative stocks.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-negative/5 rounded-xl border border-negative/20">
                    <div className="w-10 h-10 rounded-lg bg-negative/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-negative" />
                    </div>
                    <div>
                      <div className="text-xs text-textMuted">Crashing</div>
                      <div className="font-bold text-negative">{crashCompany?.name || activeEvent.crash_company}</div>
                      <div className="text-xs font-mono text-negative">{activeEvent.crash_percent}%</div>
                    </div>
                  </div>
                  {activeEvent.boost_companies.map(sym => {
                    const company = marketItems.find(m => m.symbol === sym);
                    return (
                      <div key={sym} className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-textMuted">Benefiting</div>
                          <div className="font-bold text-primary">{company?.name || sym}</div>
                          <div className="text-xs font-mono text-primary">+{activeEvent.boost_percent}%</div>
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
            <p className="text-textMuted">Market-moving events will appear here when triggered by the admin.</p>
          </Card>
        ) : pastEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">Previous Stories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.map(event => {
                const crashCompany = marketItems.find(m => m.symbol === event.crash_company);
                return (
                  <Card key={event.id} className="hover:border-border transition-colors" hoverEffect>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <span className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Market Alert</span>
                      <span className="text-[10px] text-textMuted ml-auto">
                        {new Date(event.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-textMain text-sm mb-2 leading-snug">{event.headline}</h4>
                    <p className="text-xs text-textMuted mb-3 line-clamp-2">
                      {crashCompany?.name || event.crash_company} dropped {Math.abs(event.crash_percent)}%.
                      {event.boost_companies.length > 0 && ` ${event.boost_companies.length} competitor(s) rose +${event.boost_percent}%.`}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded text-[10px] font-bold">
                        <TrendingDown className="w-2.5 h-2.5" />
                        {crashCompany?.name || event.crash_company} {event.crash_percent}%
                      </span>
                      {event.boost_companies.slice(0, 2).map(sym => {
                        const company = marketItems.find(m => m.symbol === sym);
                        return (
                          <span key={sym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {company?.name || sym} +{event.boost_percent}%
                          </span>
                        );
                      })}
                      {event.boost_companies.length > 2 && (
                        <span className="text-[10px] text-textMuted">Active for {Math.round((Date.now() - new Date(event.created_at || 0).getTime()) / 60000)} min</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-textMain">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenAdmin={onOpenAdmin} currentUserName={profile.display_name} />

      {tradeModalOpen && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          asset={selectedAsset}
          balance={balance}
          onConfirm={handleConfirmTrade}
          ownedQuantity={portfolio.find(p => p.symbol === selectedAsset?.symbol)?.amount || 0}
          transactions={transactions.filter(t => t.symbol === selectedAsset?.symbol)}
        />
      )}

      {/* News Flash Toast Notification */}
      {newsToast && (() => {
        const crashCompany = marketItems.find(m => m.symbol === newsToast.crash_company);
        return (
          <div
            className="fixed top-4 right-4 z-[100] w-96 max-w-[calc(100vw-2rem)]"
            style={{ animation: 'slideInRight 0.4s ease-out' }}
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
                  <button onClick={() => setNewsToast(null)} className="text-textMuted hover:text-textMain flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-orange-400 text-sm mb-2">{newsToast.headline}</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded text-[10px] font-bold">
                    <TrendingDown className="w-2.5 h-2.5" />
                    {crashCompany?.name || newsToast.crash_company} {newsToast.crash_percent}%
                  </span>
                  {newsToast.boost_companies.slice(0, 2).map(sym => {
                    const company = marketItems.find(m => m.symbol === sym);
                    return (
                      <span key={sym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {company?.name || sym} +{newsToast.boost_percent}%
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setNewsToast(null); setActiveTab('News Events'); }}
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
              {profile.display_name.split(' ').map(n => n[0]).join('')}
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
                  <span className="text-xs font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOutIcon className="w-4 h-4 mr-1" /> Logout
                </Button>
              </>
          </div>
        </header>

        {/* Breaking News Banner — visible on all tabs when a flash is active */}
        {(() => {
          const activeEvent = newsEvents.find(e => e.active);
          if (!activeEvent) return null;
          const crashCompany = marketItems.find(m => m.symbol === activeEvent.crash_company);
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
                <h3 className="text-sm md:text-base font-bold text-orange-400 mb-2">{activeEvent.headline}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-negative/10 text-negative rounded-lg text-xs font-semibold">
                    <TrendingDown className="w-3 h-3" />
                    {crashCompany?.name || activeEvent.crash_company} {activeEvent.crash_percent}%
                  </span>
                  {activeEvent.boost_companies.map(sym => {
                    const company = marketItems.find(m => m.symbol === sym);
                    return (
                      <span key={sym} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
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

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              {renderOverview()}
            </div>
            <div className="space-y-6">

              {/* Sentiment Gauge */}
              <Card>
                <h3 className="text-sm font-semibold mb-2">Market Sentiment</h3>
                <SentimentChart data={SENTIMENT_DATA} />
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  {SENTIMENT_DATA.map((item) => (
                    <div key={item.name}>
                      <div className="text-xs font-bold" style={{ color: item.color }}>{item.value}%</div>
                      <div className="text-[10px] text-textMuted">{item.name}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent News */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Recent News</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('News Events')}>View All</Button>
                </div>
                {newsEvents.length === 0 ? (
                  <div className="text-center py-4 text-textMuted text-xs">No news events yet</div>
                ) : (
                  <div className="space-y-2">
                    {newsEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="flex items-start gap-2 py-2 px-2 rounded-lg bg-surfaceElevated/50">
                        <Zap className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-textMain truncate">{event.headline}</div>
                          <div className="text-[10px] text-textMuted">
                            {new Date(event.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
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

        {activeTab === 'Markets' && renderMarkets()}
        {activeTab === 'Portfolio' && renderPortfolio()}
        {activeTab === 'News Events' && renderNewsEvents()}
      </main>
    </div>
  );
};