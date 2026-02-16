import { MarketItem, StockDataPoint } from './types';
import { generatePriceHistory } from './engine/priceEngine';

export const APP_NAME = "VSX: Buy or Bail";

// Generate realistic looking chart data (legacy helper)
export const generateChartData = (points: number, startValue: number, volatility: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
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

export const METRICS = [
  {
    id: '1',
    label: 'Market Cap',
    value: '₹2.4T',
    change: 3,
    history: generateChartData(20, 10, 5),
  },
  {
    id: '2',
    label: 'Volume',
    value: '₹363.89Cr',
    change: 13,
    history: generateChartData(20, 60, 10),
  },
  {
    id: '3',
    label: 'Active Traders',
    value: '40',
    change: 0,
    history: generateChartData(20, 40, 2),
  },
  {
    id: '4',
    label: 'Avg Portfolio',
    value: '₹10Cr',
    change: 0.2,
    history: generateChartData(20, 1, 0.1),
  },
];

export const INITIAL_MARKET_ITEMS: MarketItem[] = ([
  { name: 'Reliance Industries', symbol: 'RELIANCE', price: 2450.00, change: 0, sentiment: 'Bullish' as const, icon: 'R', priceHistory: [] },
  { name: 'Tata Consultancy', symbol: 'TCS', price: 3800.00, change: 0, sentiment: 'Bullish' as const, icon: 'T', priceHistory: [] },
  { name: 'HDFC Bank', symbol: 'HDFCBANK', price: 1650.00, change: 0, sentiment: 'Bullish' as const, icon: 'H', priceHistory: [] },
  { name: 'Infosys', symbol: 'INFY', price: 1520.00, change: 0, sentiment: 'Neutral' as const, icon: 'I', priceHistory: [] },
  { name: 'ICICI Bank', symbol: 'ICICIBANK', price: 1080.00, change: 0, sentiment: 'Bullish' as const, icon: 'I', priceHistory: [] },
  { name: 'Bharti Airtel', symbol: 'BHARTIARTL', price: 1420.00, change: 0, sentiment: 'Bullish' as const, icon: 'B', priceHistory: [] },
  { name: 'Wipro', symbol: 'WIPRO', price: 480.00, change: 0, sentiment: 'Neutral' as const, icon: 'W', priceHistory: [] },
  { name: 'ITC Ltd', symbol: 'ITC', price: 440.00, change: 0, sentiment: 'Neutral' as const, icon: 'I', priceHistory: [] },
  { name: 'Adani Enterprises', symbol: 'ADANIENT', price: 2850.00, change: 0, sentiment: 'Bearish' as const, icon: 'A', priceHistory: [] },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE', price: 6750.00, change: 0, sentiment: 'Bullish' as const, icon: 'B', priceHistory: [] },
  { name: 'L&T', symbol: 'LT', price: 3200.00, change: 0, sentiment: 'Bullish' as const, icon: 'L', priceHistory: [] },
  { name: 'Asian Paints', symbol: 'ASIANPAINT', price: 2780.00, change: 0, sentiment: 'Neutral' as const, icon: 'A', priceHistory: [] },
]).map(item => ({
  ...item,
  priceHistory: generatePriceHistory(item.price, 200),
}));

export const SENTIMENT_DATA = [
  { name: 'Bullish', value: 65, color: '#1ED3A6' },
  { name: 'Neutral', value: 25, color: '#8FA6A0' },
  { name: 'Bearish', value: 10, color: '#EF4444' },
];