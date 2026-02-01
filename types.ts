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

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface MarketItem {
  name: string;
  symbol: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  icon: string;
}

export interface PortfolioItem {
  asset: string;
  symbol: string;
  amount: number;
  avgPrice: number;
}

export enum ViewState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD'
}