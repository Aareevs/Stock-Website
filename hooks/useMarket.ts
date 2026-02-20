import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generatePriceHistory, tickAllPrices } from '../engine/priceEngine';

export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  icon: string;
  price_history: { time: string; value: number }[];
  priceHistory: { time: string; value: number }[]; // Alias for compatibility
}

// Transform database row to include both price_history and priceHistory
// If price_history from DB is empty, generate synthetic history client-side
const transformMarketItem = (item: any): MarketItem => {
  const dbHistory = item.price_history || [];
  const history = dbHistory.length > 0 ? dbHistory : generatePriceHistory(item.price, 50);
  return {
    ...item,
    price_history: history,
    priceHistory: history,
  };
};

export function useMarket() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Fetch initial market data
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .order('symbol');
        if (error) throw error;
        if (data) {
          setMarketItems(data.map(transformMarketItem));
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Client-side price ticking — simulate live market every 5 seconds
  useEffect(() => {
    if (!initializedRef.current && marketItems.length === 0) return;

    const tickInterval = setInterval(() => {
      setMarketItems(prev => {
        if (prev.length === 0) return prev;
        return tickAllPrices(prev);
      });
    }, 5000);

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
          const updated = transformMarketItem(payload.new);
          setMarketItems(prev =>
            prev.map(item => item.symbol === updated.symbol ? updated : item)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { marketItems, setMarketItems, loading };
}
