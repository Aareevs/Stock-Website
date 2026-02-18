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
    const totalCost = quantity * price;

    if (type === 'BUY') {
      if (totalCost > currentBalance) return { error: 'Insufficient funds' };

      // Update balance
      const newBalance = currentBalance - totalCost;
      await supabase.from('profiles').update({ cash_balance: newBalance }).eq('id', userId);

      // Upsert portfolio
      const existing = portfolio.find(p => p.symbol === symbol);
      if (existing) {
        const newAmount = existing.amount + quantity;
        const newAvg = ((existing.avg_price * existing.amount) + (price * quantity)) / newAmount;
        await supabase.from('portfolios').update({ amount: newAmount, avg_price: +newAvg.toFixed(2) }).eq('id', existing.id);
        setPortfolio(prev => prev.map(p => p.id === existing.id ? { ...p, amount: newAmount, avg_price: +newAvg.toFixed(2) } : p));
      } else {
        const { data } = await supabase.from('portfolios').insert({ user_id: userId, symbol, amount: quantity, avg_price: price }).select().single();
        if (data) setPortfolio(prev => [...prev, data as PortfolioItem]);
      }

      // Log transaction
      const { data: tx } = await supabase.from('transactions').insert({
        user_id: userId, symbol, asset_name: assetName, type: 'BUY', quantity, price,
      }).select().single();
      if (tx) setTransactions(prev => [tx as Transaction, ...prev]);

    } else {
      // SELL
      const existing = portfolio.find(p => p.symbol === symbol);
      if (!existing || existing.amount < quantity) return { error: 'Not enough shares' };

      const newBalance = currentBalance + totalCost;
      const profitLoss = (price - (purchasePrice || existing.avg_price)) * quantity;
      await supabase.from('profiles').update({ cash_balance: newBalance }).eq('id', userId);

      const newAmount = existing.amount - quantity;
      if (newAmount === 0) {
        await supabase.from('portfolios').delete().eq('id', existing.id);
        setPortfolio(prev => prev.filter(p => p.id !== existing.id));
      } else {
        await supabase.from('portfolios').update({ amount: newAmount }).eq('id', existing.id);
        setPortfolio(prev => prev.map(p => p.id === existing.id ? { ...p, amount: newAmount } : p));
      }

      const { data: tx } = await supabase.from('transactions').insert({
        user_id: userId, symbol, asset_name: assetName, type: 'SELL', quantity, price,
        purchase_price: purchasePrice || existing.avg_price, profit_loss: +profitLoss.toFixed(2),
      }).select().single();
      if (tx) setTransactions(prev => [tx as Transaction, ...prev]);
    }

    return { error: null };
  };

  return { portfolio, transactions, loading, executeTrade };
}
