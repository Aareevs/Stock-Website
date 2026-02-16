import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users, BarChart2, Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { User, MarketItem, Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StockChart, MiniSparkline } from '../dashboard/Charts';

interface AdminDashboardProps {
  users: User[];
  marketItems: MarketItem[];
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, marketItems, onBack }) => {
  const [activeView, setActiveView] = useState<'leaderboard' | 'charts'>('leaderboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChart, setSelectedChart] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-background text-textMain">
      {selectedUser && renderUserDetail()}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
            <ArrowLeft className="w-5 h-5 text-textMuted" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold">VSX Admin</h1>
            <p className="text-sm text-textMuted">Competition Management Dashboard</p>
          </div>
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
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-textMuted">Total Trades</span>
            </div>
            <div className="text-3xl font-bold">{users.reduce((acc, u) => acc + u.transactions.length, 0)}</div>
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
      </div>
    </div>
  );
};
