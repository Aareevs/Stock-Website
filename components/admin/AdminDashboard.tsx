import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users, BarChart2, Search, X, TrendingUp, TrendingDown, Newspaper, RotateCcw, Zap, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StockChart, MiniSparkline } from '../dashboard/Charts';
import type { Profile } from '../auth/AuthProvider';
import type { MarketItem } from '../../hooks/useMarket';
import type { NewsEvent } from '../../hooks/useNews';

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
    headline: string
  ) => Promise<{ error: string | null }>;
  onStopNews: (eventId: string) => Promise<{ error: string | null }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile, marketItems, newsEvents, onBack, onTriggerNews, onStopNews }) => {
  const [activeView, setActiveView] = useState<'charts' | 'news'>('news');
  const [selectedChart, setSelectedChart] = useState<MarketItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // News event form state
  const [crashSymbol, setCrashSymbol] = useState('');
  const [crashPercent, setCrashPercent] = useState(15);
  const [boostSymbols, setBoostSymbols] = useState<string[]>([]);
  const [boostPercent, setBoostPercent] = useState(8);
  const [boostDropdownOpen, setBoostDropdownOpen] = useState(false);


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

  const handleTriggerNews = async () => {
    if (!crashSymbol) return;
    await onTriggerNews(
      crashSymbol,
      -crashPercent,
      boostSymbols,
      boostPercent,
      generateHeadline()
    );
    setCrashSymbol('');
    setBoostSymbols([]);
    setCrashPercent(15);
    setBoostPercent(8);
  };


  return (
    <div className="min-h-screen bg-background text-textMain">

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
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
            <div className="text-3xl font-bold">{newsEvents.filter(e => e.active).length}</div>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
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
                  disabled={!crashSymbol || newsEvents.some(e => e.active)}
                  className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    crashSymbol && !newsEvents.some(e => e.active)
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20'
                      : 'bg-surface text-textMuted border border-border cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {newsEvents.some(e => e.active) ? 'Stop active flash first' : 'Trigger News Flash'}
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
                    const crashCompany = marketItems.find(m => m.symbol === event.crash_company);
                    return (
                      <div key={event.id} className={`rounded-lg p-4 border ${event.active ? 'bg-orange-500/5 border-orange-500/30' : 'bg-surfaceElevated border-border'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-semibold text-orange-400 flex-1">{event.headline}</div>
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
                              <span className="px-2 py-0.5 bg-surface text-textMuted border border-border rounded text-xs font-semibold">Ended</span>
                            )}
                            <span className="text-xs text-textMuted whitespace-nowrap">
                              {new Date(event.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-negative/10 text-negative rounded font-semibold">
                            <TrendingDown className="w-3 h-3" />
                            {crashCompany?.name || event.crash_company} {event.crash_percent}%
                          </span>
                          {event.boost_companies.map(sym => (
                            <span key={sym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">
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
