import React, { useState } from 'react';
import { X, Wallet, TrendingUp, TrendingDown, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketItem, Transaction } from '../../types';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketItem | null;
  balance: number;
  onConfirm: (type: 'buy' | 'sell', quantity: number) => void;
  ownedQuantity: number;
  transactions?: Transaction[];
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, 
  onClose, 
  asset, 
  balance, 
  onConfirm,
  ownedQuantity,
  transactions = []
}) => {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');
  
  if (!isOpen || !asset) return null;

  const qty = parseFloat(quantity) || 0;
  const total = qty * asset.price;
  const canBuy = type === 'buy' && total <= balance && total > 0;
  const canSell = type === 'sell' && qty <= ownedQuantity && qty > 0;
  const isValid = type === 'buy' ? canBuy : canSell;

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
              Trade {asset.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-textMuted">{asset.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-surfaceElevated border border-border text-[10px] font-semibold text-textMuted uppercase tracking-wider">
                {asset.sector}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Price Info */}
          <div className="flex justify-between items-center bg-surfaceElevated p-3 rounded-lg">
            <span className="text-sm text-textMuted">Current Price</span>
            <div className="text-right">
              <div className="font-bold text-lg font-mono">₹{(asset.price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`text-xs flex items-center justify-end gap-1 ${(asset.change ?? 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                 {(asset.change ?? 0) >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                 {(asset.change ?? 0) >= 0 ? '+' : ''}{(asset.change ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-surfaceElevated p-1 rounded-lg">
            <button 
              onClick={() => setType('buy')}
              className={`py-2 text-sm font-semibold rounded-md transition-all ${type === 'buy' ? 'bg-primary text-background shadow-lg' : 'text-textMuted hover:text-textMain'}`}
            >
              Buy
            </button>
            <button 
              onClick={() => setType('sell')}
              className={`py-2 text-sm font-semibold rounded-md transition-all ${type === 'sell' ? 'bg-negative text-white shadow-lg' : 'text-textMuted hover:text-textMain'}`}
            >
              Sell
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-textMuted uppercase mb-2 block flex justify-between">
                  <span>Quantity</span>
                  <span className="text-primary font-bold">{type === 'buy' ? `Max: ${Math.floor(balance / asset.price)}` : `Owned: ${ownedQuantity.toFixed(2)}`}</span>
                </label>
                
                <div className="relative mb-3">
                   <input 
                      type="number"
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface border border-border rounded-xl pl-4 pr-20 py-4 text-2xl font-black text-textMain focus:outline-none focus:border-primary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-textMuted font-bold bg-surface pl-2">{asset.symbol}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[0.25, 0.5, 0.75, 1].map((percent) => {
                    const maxPossible = type === 'buy' ? (balance / asset.price) : ownedQuantity;
                    const calculatedQty = (maxPossible * percent).toFixed(2);
                    
                    return (
                      <button
                        key={percent}
                        onClick={() => setQuantity(calculatedQty)}
                        className="py-1.5 bg-surfaceElevated hover:bg-surfaceElevated/80 border border-border rounded-lg text-xs font-semibold text-textMuted hover:text-textMain transition-colors"
                      >
                        {percent === 1 ? 'MAX' : `${percent * 100}%`}
                      </button>
                    );
                  })}
                </div>
             </div>

             <div className="flex justify-between items-center py-4 border-t border-dashed border-border">
                <span className="text-sm text-textMuted">Total Cost</span>
                <span className="text-2xl font-black text-textMain tracking-tight">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>

             <div className="bg-surfaceElevated p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-textMuted">
                   <Wallet className="w-4 h-4" />
                   <span className="text-xs">Wallet Balance</span>
                </div>
                <span className="text-sm font-semibold font-mono">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
          </div>

          <Button 
            onClick={() => onConfirm(type, qty)} 
            disabled={!isValid}
            className={`w-full py-3 ${type === 'sell' ? 'bg-negative hover:bg-negative/80' : ''}`}
          >
            {type === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
          </Button>

          {/* Transaction History for this stock */}
          {recentTx.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-textMuted" />
                <span className="text-xs font-semibold text-textMuted uppercase">Recent Trades</span>
              </div>
              <div className="space-y-2">
                {recentTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs bg-surfaceElevated p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${tx.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-negative/20 text-negative'}`}>
                        {tx.type}
                      </span>
                      <span className="font-mono text-textMain">{tx.quantity.toFixed(2)} @ ₹{tx.price.toFixed(2)}</span>
                    </div>
                    {tx.profitLoss !== undefined && (
                      <span className={`font-mono font-bold ${tx.profitLoss >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profitLoss >= 0 ? '+' : ''}₹{tx.profitLoss.toFixed(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};