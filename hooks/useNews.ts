import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MarketItem } from './useMarket';

export interface NewsEvent {
  id: string;
  headline: string;
  crash_company: string;
  crash_percent: number;
  boost_companies: string[];
  boost_percent: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export function useNews() {
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial news events
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('news_events')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setNewsEvents(data as NewsEvent[]);
      } catch (err) {
        console.error('Error fetching news events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Subscribe to real-time news changes (INSERT + UPDATE)
  useEffect(() => {
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news_events' },
        (payload) => {
          console.log('[Realtime] News INSERT received:', payload.new);
          const newEvent = payload.new as NewsEvent;
          setNewsEvents(prev => [newEvent, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'news_events' },
        (payload) => {
          console.log('[Realtime] News UPDATE received:', payload.new);
          const updated = payload.new as NewsEvent;
          setNewsEvents(prev =>
            prev.map(e => e.id === updated.id ? updated : e)
          );
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] news-changes subscription status:', status);
      });

    // Polling fallback: fetch every 5 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('news_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setNewsEvents(prev => {
          // Only update if there are changes to avoid unnecessary re-renders
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(data);
          return isDifferent ? (data as NewsEvent[]) : prev;
        });
      }
    }, 5000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, []);

  // Admin: trigger a news flash
  const triggerNews = async (
    headline: string,
    crashCompany: string,
    crashPercent: number,
    boostCompanies: string[],
    boostPercent: number,
    marketItems: MarketItem[],
    adminId: string
  ) => {
    // 1. Insert news event
    const { data: event, error: newsError } = await supabase
      .from('news_events')
      .insert({
        headline,
        crash_company: crashCompany,
        crash_percent: crashPercent,
        boost_companies: boostCompanies,
        boost_percent: boostPercent,
        active: true,
        created_by: adminId,
      })
      .select()
      .single();

    if (newsError) return { error: newsError.message };

    // 2. Update market prices
    const updates: PromiseLike<any>[] = [];

    // Crash company
    const crashItem = marketItems.find(m => m.symbol === crashCompany);
    if (crashItem) {
      const newPrice = +(crashItem.price * (1 - crashPercent / 100)).toFixed(2);
      updates.push(
        supabase
          .from('market_items')
          .update({
            price: newPrice,
            change: -crashPercent,
            sentiment: 'Bearish',
          })
          .eq('symbol', crashCompany)
      );
    }

    // Boost companies
    for (const sym of boostCompanies) {
      const item = marketItems.find(m => m.symbol === sym);
      if (item) {
        const newPrice = +(item.price * (1 + boostPercent / 100)).toFixed(2);
        updates.push(
          supabase
            .from('market_items')
            .update({
              price: newPrice,
              change: boostPercent,
              sentiment: 'Bullish',
            })
            .eq('symbol', sym)
        );
      }
    }

    await Promise.all(updates);
    return { error: null, event };
  };

  // Admin: stop a news flash
  const stopNews = async (eventId: string, event: NewsEvent, marketItems: MarketItem[]) => {
    // Mark event as inactive
    await supabase
      .from('news_events')
      .update({ active: false })
      .eq('id', eventId);

    // Revert sentiments to Neutral
    const affectedSymbols = [event.crash_company, ...event.boost_companies];
    const updates = affectedSymbols.map(sym =>
      supabase
        .from('market_items')
        .update({ sentiment: 'Neutral', change: 0 })
        .eq('symbol', sym)
    );
    await Promise.all(updates);
  };

  return { newsEvents, loading, triggerNews, stopNews };
}
