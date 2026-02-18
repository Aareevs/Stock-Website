import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Card } from '../ui/Card';
import { MainChart, MiniSparkline, SentimentChart } from './Charts';
import { METRICS, SENTIMENT_DATA, generateChartData } from '../../constants';
import { ArrowUpRight, ArrowDownRight, Newspaper, LogIn, LogOut as LogOutIcon, User as UserIcon, History, TrendingUp, TrendingDown, Zap, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { TradeModal } from './TradeModal';
import { MarketItem, PortfolioItem, User, Transaction, NewsEvent } from '../../types';
import { StockDetailChart } from './StockDetailChart';

interface DashboardLayoutProps {
  currentUser: User | null;
  users: User[];
  marketItems: MarketItem[];
  newsEvents: NewsEvent[];
  onUpdateUser: (user: User) => void;
  onLoginUser: (userId: string) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentUser,
  users,
  marketItems,
  newsEvents,
  onUpdateUser,
  onLoginUser,
  onLogout,
  onOpenAdmin,
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketItem | null>(null);
  const [selectedStock, setSelectedStock] = useState<MarketItem | null>(null);
  const [loginDropdown, setLoginDropdown] = useState(false);
  const [loginSearch, setLoginSearch] = useState('');

  const balance = currentUser?.cashBalance ?? 0;
  const portfolio = currentUser?.portfolio ?? [];
  const transactions = currentUser?.transactions ?? [];

  const handleOpenTrade = (asset: MarketItem) => {
    if (!currentUser) {
      setLoginDropdown(true);
      return;
    }
    setSelectedAsset(asset);
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = (type: 'buy' | 'sell', quantity: number) => {
    if (!selectedAsset || !currentUser) return;

    const totalCost = quantity * selectedAsset.price;
    let updatedUser = { ...currentUser };

    if (type === 'buy') {
      if (updatedUser.cashBalance >= totalCost) {
        updatedUser.cashBalance -= totalCost;
        const existing = updatedUser.portfolio.find(p => p.symbol === selectedAsset.symbol);
        if (existing) {
          const newTotal = existing.amount + quantity;
          const newAvg = ((existing.avgPrice * existing.amount) + totalCost) / newTotal;
          updatedUser.portfolio = updatedUser.portfolio.map(p =>
            p.symbol === selectedAsset.symbol
              ? { ...p, amount: newTotal, avgPrice: newAvg }
              : p
          );
        } else {
          updatedUser.portfolio = [
            ...updatedUser.portfolio,
            { asset: selectedAsset.name, symbol: selectedAsset.symbol, amount: quantity, avgPrice: selectedAsset.price },
          ];
        }

        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          symbol: selectedAsset.symbol,
          assetName: selectedAsset.name,
          type: 'BUY',
          quantity,
          price: selectedAsset.price,
          timestamp: Date.now(),
        };
        updatedUser.transactions = [tx, ...updatedUser.transactions];
      }
    } else {
      const existing = updatedUser.portfolio.find(p => p.symbol === selectedAsset.symbol);
      if (existing && existing.amount >= quantity) {
        updatedUser.cashBalance += totalCost;
        const profitLoss = (selectedAsset.price - existing.avgPrice) * quantity;

        const newAmount = existing.amount - quantity;
        if (newAmount <= 0) {
          updatedUser.portfolio = updatedUser.portfolio.filter(p => p.symbol !== selectedAsset.symbol);
        } else {
          updatedUser.portfolio = updatedUser.portfolio.map(p =>
            p.symbol === selectedAsset.symbol ? { ...p, amount: newAmount } : p
          );
        }

        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          symbol: selectedAsset.symbol,
          assetName: selectedAsset.name,
          type: 'SELL',
          quantity,
          price: selectedAsset.price,
          purchasePrice: existing.avgPrice,
          timestamp: Date.now(),
          profitLoss,
        };
        updatedUser.transactions = [tx, ...updatedUser.transactions];
      }
    }

    onUpdateUser(updatedUser);
    setTradeModalOpen(false);
  };

  // Calculate leaderboard
  const leaderboard = users.map(user => {
    const stockValue = user.portfolio.reduce((acc, item) => {
      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price || 0;
      return acc + (item.amount * currentPrice);
    }, 0);
    return {
      ...user,
      stockValue,
      totalNetWorth: user.cashBalance + stockValue,
    };
  }).sort((a, b) => b.totalNetWorth - a.totalNetWorth);

  // If viewing a stock detail chart
  if (selectedStock) {
    return (
      <div className="flex min-h-screen bg-background text-textMain">
        <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setSelectedStock(null); setActiveTab(tab); }} onOpenAdmin={onOpenAdmin} currentUserName={currentUser?.displayName} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
          <StockDetailChart
            stock={selectedStock}
            onBack={() => setSelectedStock(null)}
            ownedQty={portfolio.find(p => p.symbol === selectedStock.symbol)?.amount || 0}
            avgPrice={portfolio.find(p => p.symbol === selectedStock.symbol)?.avgPrice || 0}
            onTrade={() => handleOpenTrade(selectedStock)}
          />
        </main>
      </div>
    );
  }

  const renderLoginSelector = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setLoginDropdown(false)}>
      <Card className="w-full max-w-md max-h-[80vh] flex flex-col p-6" padding="none" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-textMain mb-4">Select Your Account</h2>
        <input
          type="text"
          placeholder="Search by name..."
          value={loginSearch}
          onChange={(e) => setLoginSearch(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-2 mb-4 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50"
        />
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {users
            .filter(u => u.displayName.toLowerCase().includes(loginSearch.toLowerCase()) || u.username.toLowerCase().includes(loginSearch.toLowerCase()))
            .map(user => (
              <button
                key={user.id}
                onClick={() => { onLoginUser(user.id); setLoginDropdown(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                  currentUser?.id === user.id ? 'bg-primary/20 border border-primary/50' : 'hover:bg-surfaceElevated'
                }`}
              >
                <div>
                  <div className="font-semibold text-textMain text-sm">{user.displayName}</div>
                  <div className="text-xs text-textMuted">@{user.username}</div>
                </div>
                <span className="text-xs text-textMuted font-mono">₹{user.cashBalance.toLocaleString('en-IN')}</span>
              </button>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => setLoginDropdown(false)} className="w-full">Cancel</Button>
        </div>
      </Card>
    </div>
  );

  const renderOverview = () => {
    const totalPortfolioValue = portfolio.reduce((acc, item) => {
      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price || 0;
      return acc + (item.amount * currentPrice);
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;
    const myRank = leaderboard.findIndex(u => u.id === currentUser?.id) + 1;

    return (
      <>
        {/* Balance Header */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <span className="text-sm text-textMuted block mb-1">Total Net Worth</span>
            <span className="text-4xl md:text-5xl font-bold text-textMain">
              ₹{currentUser ? totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </span>
          </div>
          {currentUser && (
            <div className="flex gap-2 mb-2">
              <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded text-sm font-semibold">
                <Trophy className="w-3 h-3" /> Rank #{myRank}
              </span>
            </div>
          )}
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
            <div className={`text-2xl font-bold font-mono ${totalNetWorth - (currentUser?.startingCapital ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
              {totalNetWorth - (currentUser?.startingCapital ?? 0) >= 0 ? '+' : ''}₹{(totalNetWorth - (currentUser?.startingCapital ?? 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </Card>
        </div>

        {/* Market Performance Snapshot */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Market Snapshot</h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('Markets')}>View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                  <th className="pb-3 pl-2">Company</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Change</th>
                  <th className="pb-3 text-right pr-2">Trend</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {marketItems.slice(0, 5).map((item) => (
                  <tr
                    key={item.symbol}
                    className="border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStock(item)}
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-primary">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-textMain">{item.name}</div>
                          <div className="text-xs text-textMuted">{item.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-medium">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1 ${item.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 pr-2 w-32">
                      <MiniSparkline data={item.priceHistory.slice(-20)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
                    <td className="py-4 font-mono font-medium">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1 ${item.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 font-mono text-textMuted">
                      {owned ? `₹${owned.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-4 w-32">
                      <MiniSparkline data={item.priceHistory.slice(-20)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
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
      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price || 0;
      return acc + (item.amount * currentPrice);
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    if (!currentUser) {
      return (
        <Card className="text-center py-20">
          <UserIcon className="w-12 h-12 mx-auto text-textMuted mb-4" />
          <h3 className="text-xl font-bold mb-2">Select Your Account</h3>
          <p className="text-textMuted mb-4">Choose your player account to view your portfolio</p>
          <Button onClick={() => setLoginDropdown(true)}>
            <LogIn className="w-4 h-4 mr-2" /> Select Account
          </Button>
        </Card>
      );
    }

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
                <SentimentChart data={portfolio.map((i, idx) => ({ name: i.symbol, value: i.amount * (marketItems.find(m => m.symbol === i.symbol)?.price || 0), color: ['#1ED3A6', '#14B8A6', '#0D9488', '#0F766E', '#10B981', '#34D399'][idx % 6] }))} />
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
                    const currentPrice = marketData?.price || 0;
                    const totalValue = item.amount * currentPrice;
                    const pnl = (currentPrice - item.avgPrice) * item.amount;
                    return (
                      <tr key={item.symbol} className="border-b border-border/50">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-textMain">
                              {item.symbol[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-textMain">{item.asset}</div>
                              <div className="text-xs text-textMuted">{item.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono">{item.amount.toFixed(2)}</td>
                        <td className="py-4 font-mono text-textMuted">₹{item.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                      <td className="py-3 font-mono">{tx.quantity.toFixed(2)}</td>
                      <td className="py-3 font-mono">₹{tx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 font-mono text-textMuted">
                        {tx.purchasePrice ? `₹${tx.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className={`py-3 font-mono font-bold ${(tx.profitLoss ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profitLoss !== undefined ? `${tx.profitLoss >= 0 ? '+' : ''}₹${tx.profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3 text-right pr-2 text-textMuted text-xs">
                        {new Date(tx.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
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

  const renderNewsEvents = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Newspaper className="w-8 h-8 text-orange-400" />
        <div>
          <h2 className="text-2xl font-bold">News Events</h2>
          <p className="text-textMuted text-sm">Market-moving news that affects stock prices</p>
        </div>
      </div>

      {newsEvents.length === 0 ? (
        <Card className="text-center py-16">
          <Newspaper className="w-12 h-12 mx-auto text-textMuted mb-4 opacity-30" />
          <h3 className="text-xl font-bold mb-2">No News Yet</h3>
          <p className="text-textMuted">Market-moving events will appear here when triggered by the admin.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {newsEvents.map((event, index) => {
            const crashCompany = marketItems.find(m => m.symbol === event.crashCompany);
            return (
              <Card key={event.id} className={`relative overflow-hidden ${index === 0 ? 'border-orange-500/30' : ''}`}>
                {index === 0 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
                )}
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-orange-500/20' : 'bg-surfaceElevated'}`}>
                    <Zap className={`w-5 h-5 ${index === 0 ? 'text-orange-400' : 'text-textMuted'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-bold ${index === 0 ? 'text-orange-400' : 'text-textMain'}`}>{event.headline}</h3>
                      <span className="text-xs text-textMuted whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-negative/10 text-negative rounded-lg text-xs font-semibold">
                        <TrendingDown className="w-3 h-3" />
                        {crashCompany?.name || event.crashCompany} {event.crashPercent}%
                      </span>
                      {event.boostCompanies.map(sym => {
                        const company = marketItems.find(m => m.symbol === sym);
                        return (
                          <span key={sym} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                            <TrendingUp className="w-3 h-3" />
                            {company?.name || sym} +{event.boostPercent}%
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-textMain">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenAdmin={onOpenAdmin} currentUserName={currentUser?.displayName} />

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

      {loginDropdown && renderLoginSelector()}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center text-sm font-bold text-primary">
                {currentUser ? currentUser.displayName.split(' ').map(n => n[0]).join('') : '?'}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-textMain leading-none">
                  {currentUser ? currentUser.displayName : 'VSX: Buy or Bail'}
                </h1>
                <span className="text-xs md:text-sm text-textMuted">
                  {currentUser ? `@${currentUser.username}` : 'Select an account to begin'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 bg-surfaceElevated px-3 py-1 rounded-lg border border-border">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOutIcon className="w-4 h-4 mr-1" /> Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => setLoginDropdown(true)}>
                <LogIn className="w-4 h-4 mr-1" /> Select Account
              </Button>
            )}
          </div>
        </header>

        {/* Breaking News Banner — visible on all tabs when a flash is active */}
        {(() => {
          const activeEvent = newsEvents.find(e => e.active);
          if (!activeEvent) return null;
          const crashCompany = marketItems.find(m => m.symbol === activeEvent.crashCompany);
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
                    {crashCompany?.name || activeEvent.crashCompany} {activeEvent.crashPercent}%
                  </span>
                  {activeEvent.boostCompanies.map(sym => {
                    const company = marketItems.find(m => m.symbol === sym);
                    return (
                      <span key={sym} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        {company?.name || sym} +{activeEvent.boostPercent}%
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
              {/* Activity Frequency */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Activity Frequency</h3>
                </div>
                <div className="grid grid-cols-7 gap-1 h-32 content-end">
                  {Array.from({ length: 49 }).map((_, i) => {
                    const opacity = Math.random();
                    const active = Math.random() > 0.6;
                    return (
                      <div
                        key={i}
                        className={`rounded-sm transition-all duration-500 hover:scale-110 ${active ? 'bg-primary' : 'bg-surfaceElevated'}`}
                        style={{
                          opacity: active ? 0.2 + (opacity * 0.8) : 1,
                          height: active ? `${20 + (opacity * 60)}%` : '100%',
                          alignSelf: 'end'
                        }}
                      />
                    );
                  })}
                </div>
              </Card>

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
                            {new Date(event.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
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