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
    value: '₹1L',
    change: 0.2,
    history: generateChartData(20, 1, 0.1),
  },
];

export const INITIAL_MARKET_ITEMS: MarketItem[] = ([
  // Automobile Sector
  { name: 'Velocity Auto', symbol: 'VELOCITY', price: 1250.00, change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'V', priceHistory: [] },
  { name: 'Apex Automotive', symbol: 'APEXAUTO', price: 850.00, change: 0, sentiment: 'Neutral' as const, sector: 'Automobile', icon: 'A', priceHistory: [] },
  { name: 'Cruiser Dynamics', symbol: 'CRUISER', price: 2150.00, change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'C', priceHistory: [] },

  // Health Sector
  { name: 'Vitalis Health', symbol: 'VITALIS', price: 1650.00, change: 0, sentiment: 'Bullish' as const, sector: 'Health', icon: 'V', priceHistory: [] },
  { name: 'CarePlus Hospitals', symbol: 'CAREPLUS', price: 3400.00, change: 0, sentiment: 'Neutral' as const, sector: 'Health', icon: 'C', priceHistory: [] },
  { name: 'Medisurge Pharma', symbol: 'MEDISURG', price: 920.00, change: 0, sentiment: 'Bearish' as const, sector: 'Health', icon: 'M', priceHistory: [] },

  // EdTech Sector
  { name: 'EduNext', symbol: 'EDUNEXT', price: 540.00, change: 0, sentiment: 'Neutral' as const, sector: 'EdTech', icon: 'E', priceHistory: [] },
  { name: 'ScholarStream', symbol: 'SCHOLAR', price: 890.00, change: 0, sentiment: 'Bullish' as const, sector: 'EdTech', icon: 'S', priceHistory: [] },
  { name: 'BrainBoost', symbol: 'BRAINB', price: 1120.00, change: 0, sentiment: 'Bearish' as const, sector: 'EdTech', icon: 'B', priceHistory: [] },

  // Food Sector
  { name: 'FreshCrave Foods', symbol: 'FRESHC', price: 430.00, change: 0, sentiment: 'Neutral' as const, sector: 'Food', icon: 'F', priceHistory: [] },
  { name: 'SpiceRoute Dining', symbol: 'SPICER', price: 1750.00, change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'S', priceHistory: [] },
  { name: 'UrbanBites', symbol: 'URBANB', price: 220.00, change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'U', priceHistory: [] },
]).map(item => ({
  ...item,
  priceHistory: generatePriceHistory(item.price, 200),
}));

export const SENTIMENT_DATA = [
  { name: 'Bullish', value: 65, color: '#1ED3A6' },
  { name: 'Neutral', value: 25, color: '#8FA6A0' },
  { name: 'Bearish', value: 10, color: '#EF4444' },
];