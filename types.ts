export interface StockDataPoint {
  time: string;
  value: number;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  change: number;
  history: { value: number }[];
}

export interface MarketItem {
  name: string;
  symbol: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sector: string;
  icon: string;
  priceHistory: StockDataPoint[];
}

export interface PortfolioItem {
  asset: string;
  symbol: string;
  amount: number;
  avgPrice: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  assetName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchasePrice?: number;
  timestamp: number;
  profitLoss?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  startingCapital: number;
  cashBalance: number;
  portfolio: PortfolioItem[];
  transactions: Transaction[];
}

export interface NewsEvent {
  id: string;
  headline: string;
  crashCompany: string;
  crashPercent: number;
  boostCompanies: string[];
  boostPercent: number;
  timestamp: number;
  active: boolean;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
}