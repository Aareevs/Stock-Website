import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  icon: string;
  price_history: { time: string; value: number }[];
}

export function useMarket() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial market data
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .order('symbol');
        if (error) throw error;
        if (data) setMarketItems(data as MarketItem[]);
      } catch (err) {
        console.error('Error fetching market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Subscribe to real-time market changes
  useEffect(() => {
    const channel = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_items' },
        (payload) => {
          const updated = payload.new as MarketItem;
          setMarketItems(prev =>
            prev.map(item => item.symbol === updated.symbol ? updated : item)
          );
        }
      )
      .subscribe();
    
    // Polling fallback: fetch every 5 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('market_items')
        .select('*')
        .order('symbol');
      if (data) {
        setMarketItems(prev => {
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(data);
          return isDifferent ? (data as MarketItem[]) : prev;
        });
      }
    }, 5000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, []);

  return { marketItems, setMarketItems, loading };
}
