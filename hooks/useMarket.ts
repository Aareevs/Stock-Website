import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { tickAllPrices } from '../engine/priceEngine';
import { getGraphPrice } from '../engine/graphPlaybackEngine';
import type { NewsEvent } from './useNews';

export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sector: string;
  icon: string;
  price_history: { time: string; value: number }[];
  priceHistory: { time: string; value: number }[]; // Alias for compatibility
}

// Transform database row — use graph data for initial price instead of random history
const transformMarketItem = (item: any): MarketItem => {
  const initialPrice = getGraphPrice(item.symbol, 0);
  return {
    ...item,
    price: initialPrice,
    change: 0,
    price_history: [],
    priceHistory: [],
  };
};

export function useMarket() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Per-stock tick counters — persisted across re-renders
  const ticksRef = useRef<Record<string, number>>({});

  // Reference to active news events — updated externally
  const activeNewsRef = useRef<NewsEvent[]>([]);

  // Fetch initial market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .order('symbol');
        if (error) throw error;
        if (data) {
          const items = data.map(transformMarketItem);
          // Initialize tick counters for each symbol at 0
          const ticks: Record<string, number> = {};
          for (const item of items) {
            ticks[item.symbol] = 0;
          }
          ticksRef.current = ticks;
          setMarketItems(items);
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Client-side price ticking — simulate live market every 5 seconds
  useEffect(() => {
    if (!initializedRef.current || marketItems.length === 0) return;

    const tickInterval = setInterval(() => {
      // Increment ticks for each symbol
      const currentTicks = ticksRef.current;
      const newTicks: Record<string, number> = {};
      for (const sym in currentTicks) {
        newTicks[sym] = (currentTicks[sym] ?? 0) + 1;
      }
      ticksRef.current = newTicks;

      // Functional state update — no mutation of previous state
      setMarketItems(prev => {
        if (prev.length === 0) return prev;
        return tickAllPrices(prev, newTicks, activeNewsRef.current);
      });
    }, 1000); // 1 tick per second — 7200 ticks = 2 hours

    return () => clearInterval(tickInterval);
  }, [marketItems.length]);

  // Subscribe to real-time DB changes (admin actions like news events, price resets)
  useEffect(() => {
    const channel = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_items' },
        (payload) => {
          const updated = payload.new as any;
          setMarketItems(prev =>
            prev.map(item => {
              if (item.symbol === updated.symbol) {
                return {
                  ...item,
                  ...updated,
                  priceHistory: item.priceHistory, // preserve client-side history
                  price_history: item.priceHistory,
                };
              }
              return item;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Method to update the active news events reference
  const setActiveNews = useCallback((events: NewsEvent[]) => {
    activeNewsRef.current = events.filter(e => e.active);
  }, []);

  // Method to reset ticks (used by reset auction)
  const resetTicks = useCallback(() => {
    const ticks: Record<string, number> = {};
    for (const sym in ticksRef.current) {
      ticks[sym] = 0;
    }
    ticksRef.current = ticks;
  }, []);

  // Get current ticks (for admin UI)
  const getTicks = useCallback((): Record<string, number> => {
    return { ...ticksRef.current };
  }, []);

  return {
    marketItems,
    setMarketItems,
    loading,
    setActiveNews,
    resetTicks,
    getTicks,
  };
}
