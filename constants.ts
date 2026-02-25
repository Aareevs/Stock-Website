import { MarketItem, StockDataPoint } from './types';
import { getGraphPrice } from './engine/graphPlaybackEngine';

export const APP_NAME = "VSX: Buy or Bail";

// Generate realistic looking chart data (legacy helper — kept for metrics only)
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

// Market items use graph data for initial prices (tick 0)
// priceHistory starts empty — populated by live ticking in useMarket
export const INITIAL_MARKET_ITEMS: MarketItem[] = [
  // Automobile Sector
  { name: 'Velocity Auto', symbol: 'VELOCITY', price: getGraphPrice('VELOCITY', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'V', priceHistory: [] },
  { name: 'Apex Automotive', symbol: 'APEXAUTO', price: getGraphPrice('APEXAUTO', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Automobile', icon: 'A', priceHistory: [] },
  { name: 'Cruiser Dynamics', symbol: 'CRUISER', price: getGraphPrice('CRUISER', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Automobile', icon: 'C', priceHistory: [] },

  // Health Sector
  { name: 'Vitalis Health', symbol: 'VITALIS', price: getGraphPrice('VITALIS', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Health', icon: 'V', priceHistory: [] },
  { name: 'CarePlus Hospitals', symbol: 'CAREPLUS', price: getGraphPrice('CAREPLUS', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Health', icon: 'C', priceHistory: [] },
  { name: 'Medisurge Pharma', symbol: 'MEDISURG', price: getGraphPrice('MEDISURG', 0), change: 0, sentiment: 'Bearish' as const, sector: 'Health', icon: 'M', priceHistory: [] },

  // EdTech Sector
  { name: 'EduNext', symbol: 'EDUNEXT', price: getGraphPrice('EDUNEXT', 0), change: 0, sentiment: 'Neutral' as const, sector: 'EdTech', icon: 'E', priceHistory: [] },
  { name: 'ScholarStream', symbol: 'SCHOLAR', price: getGraphPrice('SCHOLAR', 0), change: 0, sentiment: 'Bullish' as const, sector: 'EdTech', icon: 'S', priceHistory: [] },
  { name: 'BrainBoost', symbol: 'BRAINB', price: getGraphPrice('BRAINB', 0), change: 0, sentiment: 'Bearish' as const, sector: 'EdTech', icon: 'B', priceHistory: [] },

  // Food Sector
  { name: 'FreshCrave Foods', symbol: 'FRESHC', price: getGraphPrice('FRESHC', 0), change: 0, sentiment: 'Neutral' as const, sector: 'Food', icon: 'F', priceHistory: [] },
  { name: 'SpiceRoute Dining', symbol: 'SPICER', price: getGraphPrice('SPICER', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'S', priceHistory: [] },
  { name: 'UrbanBites', symbol: 'URBANB', price: getGraphPrice('URBANB', 0), change: 0, sentiment: 'Bullish' as const, sector: 'Food', icon: 'U', priceHistory: [] },
];

export const SENTIMENT_DATA = [
  { name: 'Bullish', value: 65, color: '#1ED3A6' },
  { name: 'Neutral', value: 25, color: '#8FA6A0' },
  { name: 'Bearish', value: 10, color: '#EF4444' },
];