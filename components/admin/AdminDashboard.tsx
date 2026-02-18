import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users, BarChart2, Search, X, TrendingUp, TrendingDown, Newspaper, RotateCcw, Zap, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { User, MarketItem, NewsEvent } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StockChart, MiniSparkline } from '../dashboard/Charts';

interface AdminDashboardProps {
  users: User[];
  marketItems: MarketItem[];
  newsEvents: NewsEvent[];
  onBack: () => void;
  onResetSimulation: () => void;
  onTriggerNewsEvent: (event: NewsEvent) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, marketItems, newsEvents, onBack, onResetSimulation, onTriggerNewsEvent }) => {
  const [activeView, setActiveView] = useState<'leaderboard' | 'charts' | 'news'>('leaderboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChart, setSelectedChart] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // News event form state
  const [crashSymbol, setCrashSymbol] = useState('');
  const [crashPercent, setCrashPercent] = useState(15);
  const [boostSymbols, setBoostSymbols] = useState<string[]>([]);
  const [boostPercent, setBoostPercent] = useState(8);
  const [boostDropdownOpen, setBoostDropdownOpen] = useState(false);

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

  const filteredLeaderboard = leaderboard.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBoostSymbol = (symbol: string) => {
    setBoostSymbols(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const generateHeadline = () => {
    const crashCompany = marketItems.find(m => m.symbol === crashSymbol);
    if (!crashCompany) return 'Breaking News: Market Disruption';
    const headlines = [
      `BREAKING: ${crashCompany.name} CEO Steps Down Amid Controversy`,
      `FLASH: ${crashCompany.name} Reports Major Quarterly Loss`,
      `ALERT: ${crashCompany.name} Faces Regulatory Investigation`,
      `SHOCK: ${crashCompany.name} Data Breach Exposes Millions`,
      `CRISIS: ${crashCompany.name} Supply Chain Collapse`,
    ];
    return headlines[Math.floor(Math.random() * headlines.length)];
  };

  const handleTriggerNews = () => {
    if (!crashSymbol) return;
    const event: NewsEvent = {
      id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      headline: generateHeadline(),
      crashCompany: crashSymbol,
      crashPercent: -crashPercent,
      boostCompanies: boostSymbols,
      boostPercent: boostPercent,
      timestamp: Date.now(),
    };
    onTriggerNewsEvent(event);
    setCrashSymbol('');
    setBoostSymbols([]);
    setCrashPercent(15);
    setBoostPercent(8);
  };

  const renderUserDetail = () => {
    if (!selectedUser) return null;
    const userData = leaderboard.find(u => u.id === selectedUser.id) || selectedUser;
    const stockValue = (userData as any).stockValue || 0;
    const totalNetWorth = (userData as any).totalNetWorth || userData.cashBalance;
    const pnl = totalNetWorth - userData.startingCapital;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
        <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden" padding="none" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-textMain">{userData.displayName}</h2>
              <span className="text-sm text-textMuted">@{userData.username}</span>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surfaceElevated p-3 rounded-lg">
              <div className="text-xs text-textMuted mb-1">Cash</div>
              <div className="font-mono font-bold">₹{userData.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-surfaceElevated p-3 rounded-lg">
              <div className="text-xs text-textMuted mb-1">Stock Value</div>
              <div className="font-mono font-bold">₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-surfaceElevated p-3 rounded-lg">
              <div className="text-xs text-textMuted mb-1">P&L</div>
              <div className={`font-mono font-bold ${pnl >= 0 ? 'text-primary' : 'text-negative'}`}>
                {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
            {/* Holdings */}
            {userData.portfolio.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Holdings ({userData.portfolio.length})</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-textMuted text-xs uppercase border-b border-border">
                      <th className="pb-2">Stock</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Avg Price</th>
                      <th className="pb-2">Current</th>
                      <th className="pb-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.portfolio.map(item => {
                      const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price || 0;
                      const itemPnl = (currentPrice - item.avgPrice) * item.amount;
                      return (
                        <tr key={item.symbol} className="border-b border-border/50">
                          <td className="py-2 font-semibold">{item.symbol}</td>
                          <td className="py-2 font-mono">{item.amount.toFixed(2)}</td>
                          <td className="py-2 font-mono text-textMuted">₹{item.avgPrice.toFixed(2)}</td>
                          <td className="py-2 font-mono">₹{currentPrice.toFixed(2)}</td>
                          <td className={`py-2 font-mono font-bold ${itemPnl >= 0 ? 'text-primary' : 'text-negative'}`}>
                            {itemPnl >= 0 ? '+' : ''}₹{itemPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transactions */}
            {userData.transactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Transactions ({userData.transactions.length})</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-textMuted text-xs uppercase border-b border-border">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Stock</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">P&L</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.transactions.slice(0, 20).map(tx => (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-negative/20 text-negative'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 font-semibold">{tx.symbol}</td>
                        <td className="py-2 font-mono">{tx.quantity.toFixed(2)}</td>
                        <td className="py-2 font-mono">₹{tx.price.toFixed(2)}</td>
                        <td className={`py-2 font-mono ${(tx.profitLoss ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {tx.profitLoss !== undefined ? `${tx.profitLoss >= 0 ? '+' : ''}₹${tx.profitLoss.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2 text-textMuted text-xs">
                          {new Date(tx.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {userData.portfolio.length === 0 && userData.transactions.length === 0 && (
              <div className="text-center py-8 text-textMuted">No trading activity yet</div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderResetConfirm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}>
      <Card className="w-full max-w-sm p-6" padding="none" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-negative/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-negative" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-textMain">Reset Simulation?</h3>
            <p className="text-xs text-textMuted">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-textMuted mb-6">
          This will reset <strong>all player portfolios</strong>, <strong>market prices</strong>, and <strong>news events</strong> back to their initial state. All trading history will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
          <button
            onClick={() => { onResetSimulation(); setShowResetConfirm(false); }}
            className="flex-1 px-4 py-2 bg-negative text-white rounded-lg font-semibold hover:bg-negative/90 transition-colors"
          >
            Reset Everything
          </button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-textMain">
      {selectedUser && renderUserDetail()}
      {showResetConfirm && renderResetConfirm()}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
              <ArrowLeft className="w-5 h-5 text-textMuted" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">VSX Admin</h1>
              <p className="text-sm text-textMuted">Competition Management Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-negative/10 text-negative border border-negative/30 rounded-lg font-semibold text-sm hover:bg-negative/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Simulation
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-textMuted">Total Players</span>
            </div>
            <div className="text-3xl font-bold">{users.length}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-textMuted">Active Stocks</span>
            </div>
            <div className="text-3xl font-bold">{marketItems.length}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-textMuted">Leader</span>
            </div>
            <div className="text-xl font-bold truncate">{leaderboard[0]?.displayName || '—'}</div>
            <div className="text-xs text-primary font-mono">₹{leaderboard[0]?.totalNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-textMuted">News Events</span>
            </div>
            <div className="text-3xl font-bold">{newsEvents.length}</div>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeView === 'leaderboard' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('leaderboard')}
          >
            <Trophy className="w-4 h-4 mr-1" /> Leaderboard
          </Button>
          <Button
            variant={activeView === 'charts' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('charts')}
          >
            <BarChart2 className="w-4 h-4 mr-1" /> All Charts
          </Button>
          <Button
            variant={activeView === 'news' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('news')}
          >
            <Newspaper className="w-4 h-4 mr-1" /> News Events
          </Button>
        </div>

        {activeView === 'leaderboard' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Competition Rankings</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                    <th className="pb-3 pl-2">Rank</th>
                    <th className="pb-3">Player</th>
                    <th className="pb-3">Cash Balance</th>
                    <th className="pb-3">Stock Value</th>
                    <th className="pb-3">Total Net Worth</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">Trades</th>
                    <th className="pb-3 text-right pr-2">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredLeaderboard.map((user, index) => {
                    const pnl = user.totalNetWorth - user.startingCapital;
                    const rank = leaderboard.findIndex(u => u.id === user.id) + 1;
                    return (
                      <tr key={user.id} className={`border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors ${index < 3 ? 'font-semibold' : ''}`}>
                        <td className="py-4 pl-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                            rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                            rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                            'text-textMuted'
                          }`}>{rank}</span>
                        </td>
                        <td className="py-4">
                          <div>
                            <div className="text-textMain">{user.displayName}</div>
                            <div className="text-xs text-textMuted">@{user.username}</div>
                          </div>
                        </td>
                        <td className="py-4 font-mono">₹{user.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="py-4 font-mono">₹{user.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="py-4 font-mono font-bold">₹{user.totalNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className={`py-4 font-mono font-bold ${pnl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-4 text-textMuted">{user.transactions.length}</td>
                        <td className="py-4 text-right pr-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedUser(user)}>View</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeView === 'charts' && (
          <div className="space-y-6">
            {selectedChart ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <button onClick={() => setSelectedChart(null)} className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
                    <ArrowLeft className="w-5 h-5 text-textMuted" />
                  </button>
                  <h3 className="text-xl font-bold">{selectedChart.name} ({selectedChart.symbol})</h3>
                  <span className={`text-sm font-semibold ${selectedChart.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                    {selectedChart.change >= 0 ? '+' : ''}{selectedChart.change.toFixed(2)}%
                  </span>
                </div>
                <Card padding="sm">
                  <StockChart data={selectedChart.priceHistory} />
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketItems.map(item => (
                  <Card
                    key={item.symbol}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    hoverEffect
                    onClick={() => setSelectedChart(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-textMain">{item.name}</div>
                        <div className="text-xs text-textMuted">{item.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">₹{item.price.toFixed(2)}</div>
                        <div className={`text-xs font-semibold ${item.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <MiniSparkline data={item.priceHistory.slice(-30)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'news' && (
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
                  <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Company to Crash</label>
                  <select
                    value={crashSymbol}
                    onChange={(e) => {
                      setCrashSymbol(e.target.value);
                      setBoostSymbols(prev => prev.filter(s => s !== e.target.value));
                    }}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select a company...</option>
                    {marketItems.map(item => (
                      <option key={item.symbol} value={item.symbol}>{item.name} ({item.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* Crash Percent */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Crash Severity</label>
                    <span className="text-sm font-bold text-negative">-{crashPercent}%</span>
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
                  <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Companies that Benefit</label>
                  <div className="relative">
                    <button
                      onClick={() => setBoostDropdownOpen(!boostDropdownOpen)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-left text-sm text-textMain focus:outline-none focus:border-primary/50 flex items-center justify-between"
                    >
                      <span className={boostSymbols.length ? 'text-textMain' : 'text-textMuted'}>
                        {boostSymbols.length ? `${boostSymbols.length} companies selected` : 'Select companies...'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${boostDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {boostDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {marketItems
                          .filter(item => item.symbol !== crashSymbol)
                          .map(item => (
                            <button
                              key={item.symbol}
                              onClick={() => toggleBoostSymbol(item.symbol)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surfaceElevated transition-colors text-left"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                boostSymbols.includes(item.symbol) ? 'bg-primary border-primary' : 'border-border'
                              }`}>
                                {boostSymbols.includes(item.symbol) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span>{item.name}</span>
                              <span className="text-textMuted text-xs ml-auto">{item.symbol}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {boostSymbols.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {boostSymbols.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {s}
                          <button onClick={() => toggleBoostSymbol(s)} className="hover:text-white">
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
                    <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Boost Amount</label>
                    <span className="text-sm font-bold text-primary">+{boostPercent}%</span>
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
                    <div className="text-xs text-textMuted uppercase tracking-wider mb-2">Preview</div>
                    <div className="text-sm font-semibold text-orange-400 mb-1">📰 {generateHeadline()}</div>
                    <div className="text-xs text-textMuted">
                      {marketItems.find(m => m.symbol === crashSymbol)?.name} drops {crashPercent}%
                      {boostSymbols.length > 0 && ` • ${boostSymbols.join(', ')} rise ${boostPercent}%`}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTriggerNews}
                  disabled={!crashSymbol}
                  className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    crashSymbol
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20'
                      : 'bg-surface text-textMuted border border-border cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" /> Trigger News Flash
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
                  <p className="text-xs mt-1">Use the form to create your first news flash</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {newsEvents.map(event => {
                    const crashCompany = marketItems.find(m => m.symbol === event.crashCompany);
                    return (
                      <div key={event.id} className="bg-surfaceElevated rounded-lg p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-semibold text-orange-400 flex-1">{event.headline}</div>
                          <span className="text-xs text-textMuted whitespace-nowrap ml-2">
                            {new Date(event.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded font-semibold">
                            <TrendingDown className="w-3 h-3" />
                            {crashCompany?.name || event.crashCompany} {event.crashPercent}%
                          </span>
                          {event.boostCompanies.map(sym => (
                            <span key={sym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">
                              <TrendingUp className="w-3 h-3" />
                              {sym} +{event.boostPercent}%
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
