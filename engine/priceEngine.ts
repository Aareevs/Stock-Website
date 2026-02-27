import { MarketItem, StockDataPoint } from '../types';
import { getGraphPrice } from './graphPlaybackEngine';
import type { NewsEvent } from '../hooks/useNews';

/**
 * Advance a single stock by one tick using deterministic graph data.
 *
 * Flow:
 *  1. Look up base price from graphData at the given tick
 *  2. If a news override is active for this symbol, apply crash/boost factor
 *  3. Compute change % from the first entry in priceHistory
 *  4. Append new data point to priceHistory (capped at 200)
 *  5. Return a NEW MarketItem — no mutation
 */
export const tickPrice = (
  item: MarketItem,
  tick: number,
  activeNewsEvents?: NewsEvent[]
): MarketItem => {
  // 1. Base price from graph
  let newPrice = getGraphPrice(item.symbol, tick);

  // 2. Apply active news override (crash or boost)
  if (activeNewsEvents && activeNewsEvents.length > 0) {
    for (const event of activeNewsEvents) {
      if (!event.active) continue;

      if (item.symbol === event.crash_company) {
        // crash_percent is already negative (e.g. -15)
        const factor = 1 + event.crash_percent / 100;
        newPrice = parseFloat((newPrice * factor).toFixed(2));
        break;
      }

      if (event.boost_companies && event.boost_companies.includes(item.symbol)) {
        const factor = 1 + event.boost_percent / 100;
        newPrice = parseFloat((newPrice * factor).toFixed(2));
        break;
      }
    }
  }

  // Ensure minimum price
  newPrice = Math.max(10, newPrice);
  newPrice = parseFloat(newPrice.toFixed(2));

  // 3. Build new history entry
  const timeLabel = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const newHistory: StockDataPoint[] = [
    ...(item.priceHistory || []).slice(-1999),
    { time: timeLabel, value: newPrice },
  ];

  // 4. Compute change % from first visible price
  const firstPrice = newHistory[0]?.value || item.price;
  const totalChange = firstPrice !== 0
    ? ((newPrice - firstPrice) / firstPrice) * 100
    : 0;

  // 5. Determine sentiment based on change
  const sentiment: 'Bullish' | 'Bearish' | 'Neutral' =
    totalChange > 0.5 ? 'Bullish' :
      totalChange < -0.5 ? 'Bearish' : 'Neutral';

  return {
    ...item,
    price: newPrice,
    change: parseFloat(totalChange.toFixed(2)),
    sentiment,
    priceHistory: newHistory,
  };
};

/**
 * Tick all market items using their individual tick counters.
 * O(n) where n = number of stocks (12).
 */
export const tickAllPrices = (
  items: MarketItem[],
  ticks: Record<string, number>,
  activeNewsEvents?: NewsEvent[]
): MarketItem[] => {
  return items.map(item => {
    const tick = ticks[item.symbol] ?? 0;
    return tickPrice(item, tick, activeNewsEvents);
  });
};

/**
 * Apply a news event — immediately shock prices and flip sentiments.
 * This is a one-shot operation triggered by the admin.
 * Unchanged from original — works with current price, not graph data.
 */
export const applyNewsEvent = (items: MarketItem[], event: NewsEvent): MarketItem[] => {
  return items.map(item => {
    if (item.symbol === event.crash_company) {
      const factor = 1 + event.crash_percent / 100; // crash_percent is negative
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory: StockDataPoint[] = [
        ...(item.priceHistory || []).slice(-199),
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

    if (event.boost_companies && event.boost_companies.includes(item.symbol)) {
      const factor = 1 + event.boost_percent / 100; // boost_percent is positive
      const newPrice = parseFloat((item.price * factor).toFixed(2));
      const newHistory: StockDataPoint[] = [
        ...(item.priceHistory || []).slice(-199),
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

/**
 * Stop a news event — revert affected stocks to Neutral sentiment.
 */
export const stopNewsEvent = (items: MarketItem[], event: NewsEvent): MarketItem[] => {
  return items.map(item => {
    if (item.symbol === event.crash_company || (event.boost_companies && event.boost_companies.includes(item.symbol))) {
      return { ...item, sentiment: 'Neutral' as const };
    }
    return item;
  });
};
