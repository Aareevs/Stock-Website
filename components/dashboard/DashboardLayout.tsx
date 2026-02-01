import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Card } from '../ui/Card';
import { MainChart, MiniChart, SentimentChart } from './Charts';
import { 
  MAIN_CHART_DATA, METRICS, CREATORS, MARKET_ITEMS, SENTIMENT_DATA, 
  NEWS_ITEMS, COMMUNITY_POSTS, generateChartData 
} from '../../constants';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Activity, BarChart2, MessageSquare, Heart, Share2, ThumbsUp, MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { TradeModal } from './TradeModal';
import { MarketItem, PortfolioItem } from '../../types';

interface DashboardLayoutProps {
  onLogout: () => void;
}

import { MarketConfigModal } from './MarketConfigModal';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [balance, setBalance] = useState(100000); // $100k Virtual Balance
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(MARKET_ITEMS);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [isMarketConfigOpen, setIsMarketConfigOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketItem | null>(null);

  const handleUpdateMarket = (newItems: MarketItem[]) => {
      setMarketItems(newItems);
  };

  // Simulate Live Market Data
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketItems(prevItems => 
        prevItems.map(item => {
          const volatility = 0.005; // 0.5% max change per tick
          const changePercent = (Math.random() - 0.5) * 2 * volatility;
          const newPrice = item.price * (1 + changePercent);
          return {
            ...item,
            price: newPrice,
            change: item.change + (changePercent * 100) // Accumulate change roughly
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenTrade = (asset: MarketItem) => {
    setSelectedAsset(asset);
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = (type: 'buy' | 'sell', quantity: number) => {
    if (!selectedAsset) return;

    const totalCost = quantity * selectedAsset.price;

    if (type === 'buy') {
      if (balance >= totalCost) {
        setBalance(prev => prev - totalCost);
        setPortfolio(prev => {
          const existing = prev.find(p => p.symbol === selectedAsset.symbol);
          if (existing) {
            return prev.map(p => p.symbol === selectedAsset.symbol ? { ...p, amount: p.amount + quantity } : p);
          }
          return [...prev, { asset: selectedAsset.name, symbol: selectedAsset.symbol, amount: quantity, avgPrice: selectedAsset.price }];
        });
      }
    } else {
      const existing = portfolio.find(p => p.symbol === selectedAsset.symbol);
      if (existing && existing.amount >= quantity) {
        setBalance(prev => prev + totalCost);
        setPortfolio(prev => {
          const newAmount = existing.amount - quantity;
          if (newAmount <= 0) {
            return prev.filter(p => p.symbol !== selectedAsset.symbol);
          }
          return prev.map(p => p.symbol === selectedAsset.symbol ? { ...p, amount: newAmount } : p);
        });
      }
    }
    setTradeModalOpen(false);
  };

  // Renderers for different views
  const renderOverview = () => (
    <>
      {/* Price Header */}
      <div className="flex items-end gap-4 mb-6">
        <span className="text-4xl md:text-5xl font-bold text-textMain">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded text-sm font-semibold mb-2">
          Virtual Balance
        </span>
      </div>

      {/* Main Chart */}
      <Card className="h-[400px] mb-6" padding="sm">
        <MainChart data={MAIN_CHART_DATA} />
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {METRICS.map((metric) => (
          <Card key={metric.id} className="relative group" hoverEffect>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-textMuted font-medium">{metric.label}</span>
              <input type="checkbox" className="accent-primary rounded border-border bg-surfaceElevated w-4 h-4" />
            </div>
            <div className="mb-4">
              <div className="text-xl font-bold text-textMain">{metric.value}</div>
              <div className={`text-xs flex items-center gap-1 ${metric.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                {metric.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metric.change)}
              </div>
            </div>
            <MiniChart data={metric.history} color={metric.change >= 0 ? '#1ED3A6' : '#EF4444'} />
          </Card>
        ))}
      </div>

      {/* Market Performance Snapshot */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Market Performance</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('Markets')}>View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                <th className="pb-3 pl-2">Company</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Change (24h)</th>
                <th className="pb-3 text-right pr-2">Trend</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {marketItems.slice(0, 5).map((item) => (
                <tr key={item.symbol} className="border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors">
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
                  <td className="py-4 font-medium">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 ${item.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 pr-2 w-32">
                    <MiniChart data={generateChartData(10, 100, 10)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderMarkets = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
              <h3 className="text-sm text-textMuted mb-2">Market Status</h3>
              <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/> Live
              </div>
              <div className="text-primary text-sm flex items-center gap-1">Prices update every 3s</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
              <h3 className="text-sm text-textMuted mb-2">Your Purchasing Power</h3>
              <div className="text-2xl font-bold mb-1">${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-textMuted text-sm flex items-center gap-1">Available to trade</div>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceElevated">
              <h3 className="text-sm text-textMuted mb-2">Tech Sector</h3>
              <div className="text-2xl font-bold mb-1">+1.24%</div>
              <div className="text-primary text-sm flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Bullish</div>
          </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Live Market Data</h3>
          <div className="flex gap-2">
             <Button variant="secondary" size="sm" onClick={() => setIsMarketConfigOpen(true)}>Manage Market</Button>
             <Button variant="ghost" size="sm">Favorites</Button>
             <Button variant="secondary" size="sm">Tech Stocks</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                <th className="pb-3 pl-2">Company</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Change (24h)</th>
                <th className="pb-3">Trend</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {marketItems.map((item) => (
                <tr key={item.symbol} className="border-b border-border/50 hover:bg-surfaceElevated/50 transition-colors group">
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center font-bold text-primary transition-transform group-hover:scale-110">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-textMain">{item.name}</div>
                        <div className="text-xs text-textMuted">{item.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-medium">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 ${item.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 pr-2 w-32">
                    <MiniChart data={generateChartData(15, 100, 15)} color={item.change >= 0 ? '#1ED3A6' : '#EF4444'} />
                  </td>
                  <td className="py-4">
                    <Button size="sm" onClick={() => handleOpenTrade(item)} className="opacity-0 group-hover:opacity-100 transition-opacity">Trade</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPortfolio = () => {
    // Calculate Portfolio Value dynamically based on current market prices
    const totalPortfolioValue = portfolio.reduce((acc, item) => {
        const currentPrice = marketItems.find(m => m.symbol === item.symbol)?.price || 0;
        return acc + (item.amount * currentPrice);
    }, 0);
    const totalNetWorth = balance + totalPortfolioValue;

    return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-surface to-surfaceElevated">
               <div className="relative z-10">
                   <h3 className="text-sm text-textMuted mb-2">Total Net Worth</h3>
                   <div className="text-4xl font-bold mb-4">${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                   <div className="flex gap-4">
                       <div className="px-3 py-1 bg-surface/50 rounded border border-border">
                          <span className="text-xs text-textMuted block">Cash Balance</span>
                          <span className="font-mono">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                       </div>
                       <div className="px-3 py-1 bg-surface/50 rounded border border-border">
                          <span className="text-xs text-textMuted block">Stock Value</span>
                          <span className="font-mono">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                   <th className="pb-3">Quantity</th>
                   <th className="pb-3">Current Price</th>
                   <th className="pb-3">Total Value</th>
                   <th className="pb-3 text-right pr-2">Actions</th>
                 </tr>
               </thead>
               <tbody className="text-sm">
                 {portfolio.map((item) => {
                   const marketData = marketItems.find(m => m.symbol === item.symbol);
                   const currentPrice = marketData?.price || 0;
                   const totalValue = item.amount * currentPrice;
                   
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
                     <td className="py-4 font-mono">{item.amount.toFixed(4)}</td>
                     <td className="py-4 text-textMuted">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                     <td className="py-4 font-bold text-textMain">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                     <td className="py-4 text-right pr-2">
                       <Button size="sm" variant="secondary" onClick={() => handleOpenTrade(marketData!)}>Trade</Button>
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
           )}
       </Card>
    </div>
  )};

  const renderNews = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Latest Market Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {NEWS_ITEMS.map((news) => (
                <Card key={news.id} className="flex flex-col h-full group cursor-pointer overflow-hidden" padding="none">
                    <div className="h-48 overflow-hidden relative">
                        <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold">
                            {news.sentiment}
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-xs text-textMuted mb-3">
                            <span>{news.source}</span>
                            <span>•</span>
                            <span>{news.time}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{news.title}</h3>
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                             <div className="flex gap-4">
                                 <button className="text-textMuted hover:text-textMain"><ThumbsUp className="w-4 h-4"/></button>
                                 <button className="text-textMuted hover:text-textMain"><MessageCircle className="w-4 h-4"/></button>
                             </div>
                             <button className="text-textMuted hover:text-primary"><Share2 className="w-4 h-4"/></button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="max-w-3xl mx-auto space-y-6">
        <Card>
            <div className="flex gap-4">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" className="w-10 h-10 rounded-full object-cover" alt="You" />
                <div className="flex-1">
                    <input type="text" placeholder="Share your market analysis..." className="w-full bg-surfaceElevated border border-border rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-primary/50 text-textMain placeholder:text-textMuted" />
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 text-primary">
                           <Button variant="ghost" size="sm" className="p-2"><Activity className="w-4 h-4"/></Button>
                           <Button variant="ghost" size="sm" className="p-2"><BarChart2 className="w-4 h-4"/></Button>
                        </div>
                        <Button size="sm">Post</Button>
                    </div>
                </div>
            </div>
        </Card>

        <div className="space-y-4">
            {COMMUNITY_POSTS.map((post) => (
                <Card key={post.id} className="hover:bg-surfaceElevated/30 transition-colors cursor-pointer">
                    <div className="flex gap-4">
                        <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full border border-border object-cover" />
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <span className="font-bold text-textMain mr-2">{post.user}</span>
                                    <span className="text-textMuted text-sm">{post.handle}</span>
                                </div>
                                <span className="text-textMuted text-xs">{post.time}</span>
                            </div>
                            <p className="text-textMain text-sm leading-relaxed mb-3">{post.content}</p>
                            <div className="flex gap-6 text-textMuted text-xs">
                                <button className="flex items-center gap-1.5 hover:text-primary"><Heart className="w-4 h-4"/> {post.likes}</button>
                                <button className="flex items-center gap-1.5 hover:text-primary"><MessageSquare className="w-4 h-4"/> {post.comments}</button>
                                <button className="flex items-center gap-1.5 hover:text-primary"><Share2 className="w-4 h-4"/> Share</button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-textMain">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      
      {tradeModalOpen && (
        <TradeModal 
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          asset={selectedAsset}
          balance={balance}
          onConfirm={handleConfirmTrade}
          ownedQuantity={portfolio.find(p => p.symbol === selectedAsset?.symbol)?.amount || 0}
        />
      )}

      <MarketConfigModal 
        isOpen={isMarketConfigOpen}
        onClose={() => setIsMarketConfigOpen(false)}
        currentItems={marketItems}
        onSave={handleUpdateMarket}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-textMain leading-none">Aareev Srinivasan</h1>
                <span className="text-xs md:text-sm text-textMuted">Aareev</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <div className="hidden md:flex bg-surface border border-border rounded-lg p-1">
                {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map((tf, i) => (
                    <button key={tf} className={`px-3 py-1 text-xs font-semibold rounded ${i === 3 ? 'bg-primary text-background' : 'text-textMuted hover:text-textMain'}`}>
                        {tf}
                    </button>
                ))}
             </div>
             <div className="flex items-center gap-2 bg-surfaceElevated px-3 py-1 rounded-lg border border-border">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono">${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
             </div>
          </div>
        </header>

        {activeTab === 'Overview' && (
           <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
             <div className="xl:col-span-3 space-y-6">
                {renderOverview()}
             </div>
             <div className="space-y-6">
                {/* Right Sidebar Widgets */}
                
                {/* Top Creators */}
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-textMain">Top Creators</h3>
                    <ArrowUpRight className="w-4 h-4 text-textMuted cursor-pointer hover:text-primary" />
                  </div>
                  <div className="flex gap-2 mb-2">
                    {CREATORS.map((creator) => (
                      <div key={creator.id} className="relative group cursor-pointer">
                        <img 
                          src={creator.avatar} 
                          alt={creator.name} 
                          className={`w-10 h-10 rounded-full border-2 ${
                            creator.sentiment === 'positive' ? 'border-primary' : 
                            creator.sentiment === 'negative' ? 'border-negative' : 'border-gray-500'
                          }`}
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-surface border border-surface flex items-center justify-center">
                           <div className={`w-1.5 h-1.5 rounded-full ${
                               creator.sentiment === 'positive' ? 'bg-primary' : 
                               creator.sentiment === 'negative' ? 'bg-negative' : 'bg-gray-500'
                           }`} />
                        </div>
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full bg-surfaceElevated border border-border flex items-center justify-center text-xs font-bold text-textMuted">
                      +120
                    </div>
                  </div>
                </Card>

                {/* Activity Frequency */}
                <Card>
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Activity Frequency</h3>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button className="px-3 py-1 bg-surfaceElevated rounded text-xs text-textMain border border-border">Mentions</button>
                    <button className="px-3 py-1 bg-transparent rounded text-xs text-textMuted hover:text-textMain">Engagements</button>
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
                          )
                      })}
                  </div>
                  <div className="flex justify-between text-xs text-textMuted mt-2 font-mono">
                      <span>Sun</span><span>Sun</span><span>Sun</span>
                  </div>
                </Card>

                {/* Sentiment Gauge */}
                <Card>
                  <h3 className="text-sm font-semibold mb-2">Sentiment</h3>
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
                
                {/* Feed Snippets */}
                 <div className="space-y-2">
                     {CREATORS.slice(0, 3).map((creator, i) => (
                         <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface/50 border border-border/50 hover:bg-surfaceElevated transition-colors cursor-pointer">
                             <img src={creator.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-baseline">
                                     <span className="text-xs font-bold text-textMain truncate">{creator.name}</span>
                                     <span className="text-[10px] text-textMuted">{2 + i}h ago</span>
                                 </div>
                                 <p className="text-xs text-textMuted truncate">Market analysis indicates a strong breakout pattern for $BTC...</p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
           </div>
        )}

        {activeTab === 'Markets' && renderMarkets()}
        {activeTab === 'Portfolio' && renderPortfolio()}
        {activeTab === 'News Feed' && renderNews()}
        {activeTab === 'Community' && renderCommunity()}

      </main>
    </div>
  );
};