import { Metric, Creator, MarketItem } from './types';

export const APP_NAME = "NovaTrade";

// Generate realistic looking chart data
export const generateChartData = (points: number, startValue: number, volatility: number) => {
  const data = [];
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

export const METRICS: Metric[] = [
  {
    id: '1',
    label: 'AltRank™',
    value: '#14',
    change: 3,
    history: generateChartData(20, 10, 5),
  },
  {
    id: '2',
    label: 'Galaxy Score™',
    value: '67/100',
    change: 13,
    history: generateChartData(20, 60, 10),
  },
  {
    id: '3',
    label: 'Social Volume',
    value: '363.89M',
    change: 359.5,
    history: generateChartData(20, 300, 50),
  },
  {
    id: '4',
    label: 'Social Dominance',
    value: '1.03%',
    change: 0.2,
    history: generateChartData(20, 1, 0.1),
  },
];

export const CREATORS: Creator[] = [
  { id: '1', name: 'Scott "Kidd" Poteet', handle: '@polaris_dawn', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60', sentiment: 'positive' },
  { id: '2', name: 'Sarah Chen', handle: '@schen_fin', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60', sentiment: 'neutral' },
  { id: '3', name: 'Marcus Ray', handle: '@mray_trades', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', sentiment: 'positive' },
  { id: '4', name: 'Elena Vosk', handle: '@evosk_crypto', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60', sentiment: 'negative' },
];

export const MARKET_ITEMS: MarketItem[] = [
  { name: 'Apple Inc.', symbol: 'AAPL', price: 178.23, change: 1.2, sentiment: 'Bullish', icon: 'A' },
  { name: 'Microsoft', symbol: 'MSFT', price: 420.55, change: 2.1, sentiment: 'Bullish', icon: 'M' },
  { name: 'Nvidia', symbol: 'NVDA', price: 890.00, change: 4.5, sentiment: 'Bullish', icon: 'N' },
  { name: 'Amazon', symbol: 'AMZN', price: 185.10, change: -0.5, sentiment: 'Neutral', icon: 'A' },
  { name: 'Google', symbol: 'GOOGL', price: 173.40, change: 0.8, sentiment: 'Neutral', icon: 'G' },
  { name: 'Meta', symbol: 'META', price: 495.20, change: 3.2, sentiment: 'Bullish', icon: 'M' },
  { name: 'Tesla', symbol: 'TSLA', price: 178.40, change: -3.1, sentiment: 'Bearish', icon: 'T' },
  { name: 'Netflix', symbol: 'NFLX', price: 620.30, change: 1.5, sentiment: 'Bullish', icon: 'N' },
  { name: 'AMD', symbol: 'AMD', price: 170.50, change: -1.2, sentiment: 'Neutral', icon: 'A' },
  { name: 'Intel', symbol: 'INTC', price: 35.40, change: -4.5, sentiment: 'Bearish', icon: 'I' },
  { name: 'Coinbase', symbol: 'COIN', price: 245.80, change: 5.6, sentiment: 'Bullish', icon: 'C' },
  { name: 'Palantir', symbol: 'PLTR', price: 24.50, change: 2.3, sentiment: 'Bullish', icon: 'P' },
];

export const SENTIMENT_DATA = [
  { name: 'Bullish', value: 65, color: '#1ED3A6' },
  { name: 'Neutral', value: 25, color: '#8FA6A0' },
  { name: 'Bearish', value: 10, color: '#EF4444' },
];

export const PORTFOLIO_ITEMS = []; // Start empty

export const NEWS_ITEMS = [
  { id: 1, title: 'Tech Sector Rallies on AI Developments', source: 'MarketWatch', time: '2h ago', sentiment: 'Positive', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=500&auto=format&fit=crop&q=60' },
  { id: 2, title: 'Fed Signals Interest Rate Cuts in Q4', source: 'Bloomberg', time: '4h ago', sentiment: 'Positive', image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=500&auto=format&fit=crop&q=60' },
  { id: 3, title: 'EV Market Faces Supply Chain Hurdles', source: 'Reuters', time: '5h ago', sentiment: 'Neutral', image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=500&auto=format&fit=crop&q=60' },
  { id: 4, title: 'Crypto Markets Stabilize After Volatility', source: 'CoinDesk', time: '7h ago', sentiment: 'Positive', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60' },
];

export const COMMUNITY_POSTS = [
  { id: 1, user: 'Alex Morgan', handle: '@amorgan', content: 'Just bought more $NVDA. The AI revolution is just getting started.', likes: 45, comments: 12, time: '10m ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' },
  { id: 2, user: 'Sarah Chen', handle: '@schen_fin', content: 'Watching the support levels on $TSLA closely. Might be a good entry point.', likes: 120, comments: 34, time: '1h ago', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60' },
  { id: 3, user: 'David Kim', handle: '@dkim_trader', content: 'Tech earnings this week are going to be crucial for market direction.', likes: 89, comments: 21, time: '3h ago', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=100&auto=format&fit=crop&q=60' },
];