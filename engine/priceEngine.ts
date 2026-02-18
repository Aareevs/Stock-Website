import { MarketItem, StockDataPoint, NewsEvent } from '../types';

// Generate initial price history for a stock
export const generatePriceHistory = (
  basePrice: number,
  points: number = 100,
  volatility: number = 0.008
): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let current = basePrice;
  const now = Date.now();

  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 2 * volatility;
    current = current * (1 + change);
    current = Math.max(current, basePrice * 0.5);
    data.push({
      time: new Date(now - i * 5000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      value: parseFloat(current.toFixed(2)),
    });
  }
  return data;
};

// Advance price by one tick (5 seconds)
export const tickPrice = (item: MarketItem): MarketItem => {
  const volatility = 0.004; // 0.4% max change per tick
  const sentimentBias =
    item.sentiment === 'Bullish' ? 0.0005 :
    item.sentiment === 'Bearish' ? -0.0005 : 0;

  const changePercent = (Math.random() - 0.5) * 2 * volatility + sentimentBias;
  const newPrice = parseFloat((item.price * (1 + changePercent)).toFixed(2));

  const newHistory = [
    ...item.priceHistory.slice(-199),
    {
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      value: newPrice,
    },
  ];

  const firstPrice = newHistory[0]?.value || item.price;
  const totalChange = ((newPrice - firstPrice) / firstPrice) * 100;

  return {
    ...item,
    price: newPrice,
    change: parseFloat(totalChange.toFixed(2)),
    priceHistory: newHistory,
  };
};

// Tick all market items
export const tickAllPrices = (items: MarketItem[]): MarketItem[] => {
  return items.map(tickPrice);
};

// Apply a news event — immediately shock prices and flip sentiments
export const applyNewsEvent = (items: MarketItem[], event: NewsEvent): MarketItem[] => {
  return items.map(item => {
    if (item.symbol === event.crashCompany) {
      const factor = 1 + event.crashPercent / 100; // crashPercent is negative
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory = [
        ...item.priceHistory.slice(-199),
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: newPrice,
        },
      ];
      const firstPrice = newHistory[0]?.value || item.price;
      return {
        ...item,
        price: newPrice,
        change: parseFloat((((newPrice - firstPrice) / firstPrice) * 100).toFixed(2)),
        sentiment: 'Bearish' as const,
        priceHistory: newHistory,
      };
    }

    if (event.boostCompanies.includes(item.symbol)) {
      const factor = 1 + event.boostPercent / 100; // boostPercent is positive
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory = [
        ...item.priceHistory.slice(-199),
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: newPrice,
        },
      ];
      const firstPrice = newHistory[0]?.value || item.price;
      return {
        ...item,
        price: newPrice,
        change: parseFloat((((newPrice - firstPrice) / firstPrice) * 100).toFixed(2)),
        sentiment: 'Bullish' as const,
        priceHistory: newHistory,
      };
    }

    return item;
  });
};

