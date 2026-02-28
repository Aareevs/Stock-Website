import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PortfolioItem {
  id: string;
  user_id: string;
  symbol: string;
  amount: number;
  avg_price: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  asset_name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchase_price?: number;
  profit_loss?: number;
  created_at: string;
}

export function usePortfolio(userId: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio and transactions
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [{ data: pData, error: pError }, { data: tData, error: tError }] = await Promise.all([
          supabase.from('portfolios').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);
        
        if (pError) throw pError;
        if (tError) throw tError;

        if (pData) setPortfolio(pData as PortfolioItem[]);
        if (tData) setTransactions(tData as Transaction[]);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    // Polling fallback: fetch every 5 seconds
    const interval = setInterval(async () => {
      const [{ data: pData }, { data: tData }] = await Promise.all([
        supabase.from('portfolios').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      
      if (pData) {
        setPortfolio(prev => {
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(pData);
          return isDifferent ? (pData as PortfolioItem[]) : prev;
        });
      }
      if (tData) {
        setTransactions(prev => {
          const isDifferent = JSON.stringify(prev) !== JSON.stringify(tData);
          return isDifferent ? (tData as Transaction[]) : prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  // Execute a trade
  const executeTrade = async (
    userId: string,
    symbol: string,
    assetName: string,
    type: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    currentBalance: number,
    purchasePrice?: number
  ): Promise<{ error: string | null }> => {
    
    // Call the atomic postgres function to prevent negative balance/holdings race conditions
    const { data, error } = await supabase.rpc('execute_trade', {
      p_user_id: userId,
      p_symbol: symbol,
      p_asset_name: assetName,
      p_type: type,
      p_quantity: quantity,
      p_price: price
    });

    if (error) {
      console.error('[executeTrade RPC Error]:', error);
      return { error: 'Transaction failed on the server. Please try again.' };
    }

    if (data && !data.success) {
      return { error: data.error || 'Transaction denied.' };
    }

    // After a successful trade, force an immediate refresh of the local state 
    // to instantly update the UI (the 5s polling will catch anything else)
    const [{ data: pData }, { data: tData }] = await Promise.all([
      supabase.from('portfolios').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    if (pData) setPortfolio(pData as PortfolioItem[]);
    if (tData) setTransactions(tData as Transaction[]);

    return { error: null };
  };

  return { portfolio, transactions, loading, executeTrade };
}
