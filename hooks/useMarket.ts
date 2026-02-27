import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { tickAllPrices } from '../engine/priceEngine';
import { getGraphPrice } from '../engine/graphPlaybackEngine';
import type { NewsEvent } from './useNews';

export type SimState = 'idle' | 'running' | 'paused';

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

// Database row shape for the global simulation_state table
interface SimulationStateRow {
  id: number;
  status: SimState;
  elapsed_seconds: number;
  last_started_at: string | null;
  updated_at: string;
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

  // Global simulation state — driven by database
  const [simState, setSimState] = useState<SimState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // DB row ref — keeps the latest DB snapshot for time calculation
  const dbStateRef = useRef<SimulationStateRow | null>(null);

  const initializedRef = useRef(false);

  // Per-stock tick counters — persisted across re-renders
  const ticksRef = useRef<Record<string, number>>({});

  // Reference to active news events — updated externally
  const activeNewsRef = useRef<NewsEvent[]>([]);

  // Interval ref so we can clear it from control functions
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Helper: compute real elapsed seconds from a DB row ───
  const computeElapsed = useCallback((row: SimulationStateRow): number => {
    let elapsed = row.elapsed_seconds;
    if (row.status === 'running' && row.last_started_at) {
      const serverStart = new Date(row.last_started_at).getTime();
      const delta = Math.floor((Date.now() - serverStart) / 1000);
      elapsed += Math.max(0, delta);
    }
    return Math.min(elapsed, 7200); // Cap at 2 hours
  }, []);

  // ─── Fetch initial market data ───
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
          // Initialize tick counters — use restored elapsed if sim state was already fetched
          const restoredElapsed = dbStateRef.current ? computeElapsed(dbStateRef.current) : 0;
          const ticks: Record<string, number> = {};
          for (const item of items) {
            ticks[item.symbol] = restoredElapsed;
          }
          ticksRef.current = ticks;
          setMarketItems(items);
          initializedRef.current = true;
          console.log('[Market] Initialized ticks at:', restoredElapsed);
        }
      } catch (err) {
        console.error('Error fetching market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [computeElapsed]);

  // ─── Fetch initial simulation state from DB ───
  useEffect(() => {
    const fetchSimState = async () => {
      try {
        const { data, error } = await supabase
          .from('simulation_state')
          .select('*')
          .eq('id', 1)
          .single();

        console.log('[SimState] DB fetch result:', { data, error: error?.message });

        if (error) {
          console.warn('[SimState] Could not fetch simulation_state:', error.message);
          return;
        }
        if (data) {
          const row = data as SimulationStateRow;
          dbStateRef.current = row;
          setSimState(row.status);
          const elapsed = computeElapsed(row);
          setElapsedSeconds(elapsed);
          console.log('[SimState] Restored state:', row.status, 'elapsed:', elapsed, 'last_started_at:', row.last_started_at);

          // Sync tick counters to the restored elapsed time
          const ticks: Record<string, number> = {};
          for (const sym in ticksRef.current) {
            ticks[sym] = elapsed;
          }
          ticksRef.current = ticks;
        }
      } catch (err) {
        console.error('[SimState] Error fetching simulation state:', err);
      }
    };
    fetchSimState();
  }, [computeElapsed]);

  // ─── Subscribe to realtime changes on simulation_state ───
  useEffect(() => {
    const channel = supabase
      .channel('sim-state-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'simulation_state' },
        (payload) => {
          const row = payload.new as SimulationStateRow;
          dbStateRef.current = row;
          setSimState(row.status);
          const elapsed = computeElapsed(row);
          setElapsedSeconds(elapsed);

          // Sync tick counters
          const ticks: Record<string, number> = {};
          for (const sym in ticksRef.current) {
            ticks[sym] = elapsed;
          }
          ticksRef.current = ticks;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [computeElapsed]);

  // ─── Client-side price ticking — only runs when simState is 'running' ───
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (simState !== 'running' || !initializedRef.current || marketItems.length === 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      // Recalculate elapsed from DB state (accurate even after a refresh)
      const dbRow = dbStateRef.current;
      if (!dbRow || dbRow.status !== 'running') return;

      const elapsed = computeElapsed(dbRow);
      setElapsedSeconds(elapsed);

      // Sync tick counters
      const newTicks: Record<string, number> = {};
      for (const sym in ticksRef.current) {
        newTicks[sym] = elapsed;
      }
      ticksRef.current = newTicks;

      // Functional state update — no mutation of previous state
      setMarketItems(prev => {
        if (prev.length === 0) return prev;
        return tickAllPrices(prev, newTicks, activeNewsRef.current);
      });
    }, 1000); // 1 tick per second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [simState, marketItems.length, computeElapsed]);

  // ─── Subscribe to real-time DB changes (admin actions like news events, price resets) ───
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

  // ─── Simulation Controls (all update the DB) ───

  const startSimulation = useCallback(async () => {
    // Optimistically update local state
    setSimState('running');
    const now = new Date().toISOString();
    const currentElapsed = dbStateRef.current?.elapsed_seconds ?? 0;
    dbStateRef.current = {
      ...(dbStateRef.current || { id: 1, elapsed_seconds: 0, updated_at: now }),
      status: 'running',
      last_started_at: now,
    };

    console.log('[SimState] Starting simulation. last_started_at:', now, 'elapsed_seconds:', currentElapsed);

    const { data, error } = await supabase
      .from('simulation_state')
      .update({
        status: 'running',
        last_started_at: now,
        updated_at: now,
      })
      .eq('id', 1)
      .select();

    console.log('[SimState] Start DB result:', { data, error: error?.message });
    if (error) console.error('[SimState] Failed to start simulation:', error);
  }, []);

  const pauseSimulation = useCallback(async () => {
    // Calculate exact elapsed and persist it
    const dbRow = dbStateRef.current;
    const elapsed = dbRow ? computeElapsed(dbRow) : elapsedSeconds;

    setSimState('paused');
    setElapsedSeconds(elapsed);
    dbStateRef.current = {
      ...(dbStateRef.current || { id: 1, updated_at: new Date().toISOString() }),
      status: 'paused',
      elapsed_seconds: elapsed,
      last_started_at: null,
    };

    const { error } = await supabase
      .from('simulation_state')
      .update({
        status: 'paused',
        elapsed_seconds: elapsed,
        last_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) console.error('[SimState] Failed to pause simulation:', error);
  }, [computeElapsed, elapsedSeconds]);

  const resetSimulation = useCallback(async () => {
    setSimState('idle');
    setElapsedSeconds(0);
    // Reset tick counters to 0
    const ticks: Record<string, number> = {};
    for (const sym in ticksRef.current) {
      ticks[sym] = 0;
    }
    ticksRef.current = ticks;
    // Reset market items to initial graph prices
    setMarketItems(prev =>
      prev.map(item => ({
        ...item,
        price: getGraphPrice(item.symbol, 0),
        change: 0,
        sentiment: 'Neutral' as const,
        priceHistory: [],
        price_history: [],
      }))
    );

    dbStateRef.current = {
      id: 1,
      status: 'idle',
      elapsed_seconds: 0,
      last_started_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('simulation_state')
      .update({
        status: 'idle',
        elapsed_seconds: 0,
        last_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) console.error('[SimState] Failed to reset simulation:', error);
  }, []);

  // Skip to a specific tick (for testing / admin time-jump)
  const skipToTick = useCallback(async (targetTick: number) => {
    const safeTick = Math.max(0, Math.min(targetTick, 7200));
    // Update tick counters
    const ticks: Record<string, number> = {};
    for (const sym in ticksRef.current) {
      ticks[sym] = safeTick;
    }
    ticksRef.current = ticks;
    setElapsedSeconds(safeTick);

    // Recalculate prices at the target tick
    setMarketItems(prev =>
      prev.map(item => {
        const newPrice = getGraphPrice(item.symbol, safeTick);
        const startPrice = getGraphPrice(item.symbol, 0);
        const change = startPrice !== 0
          ? ((newPrice - startPrice) / startPrice) * 100
          : 0;
        return {
          ...item,
          price: newPrice,
          change: parseFloat(change.toFixed(2)),
          sentiment:
            change > 0.5 ? 'Bullish' as const :
            change < -0.5 ? 'Bearish' as const : 'Neutral' as const,
          priceHistory: [{ time: `${safeTick}s`, value: newPrice }],
          price_history: [{ time: `${safeTick}s`, value: newPrice }],
        };
      })
    );

    // Persist to DB: if running, set last_started_at = now so the timer continues from the skip point
    const isRunning = simState === 'running';
    const now = new Date().toISOString();
    dbStateRef.current = {
      id: 1,
      status: simState,
      elapsed_seconds: safeTick,
      last_started_at: isRunning ? now : null,
      updated_at: now,
    };

    const { error } = await supabase
      .from('simulation_state')
      .update({
        elapsed_seconds: safeTick,
        last_started_at: isRunning ? now : null,
        updated_at: now,
      })
      .eq('id', 1);

    if (error) console.error('[SimState] Failed to skip:', error);
  }, [simState]);

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
    // Simulation controls
    simState,
    elapsedSeconds,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    skipToTick,
  };
}
