import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketItem } from '../../types';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketItem | null;
  balance: number;
  onConfirm: (type: 'buy' | 'sell', quantity: number) => void;
  ownedQuantity: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, 
  onClose, 
  asset, 
  balance, 
  onConfirm,
  ownedQuantity
}) => {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');
  
  if (!isOpen || !asset) return null;

  const qty = parseFloat(quantity) || 0;
  const total = qty * asset.price;
  const canBuy = type === 'buy' && total <= balance && total > 0;
  const canSell = type === 'sell' && qty <= ownedQuantity && qty > 0;
  const isValid = type === 'buy' ? canBuy : canSell;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
              Trade {asset.symbol}
            </h3>
            <span className="text-xs text-textMuted">{asset.name}</span>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Price Info */}
          <div className="flex justify-between items-center bg-surfaceElevated p-3 rounded-lg">
            <span className="text-sm text-textMuted">Current Price</span>
            <div className="text-right">
              <div className="font-bold text-lg">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`text-xs flex items-center justify-end gap-1 ${asset.change >= 0 ? 'text-primary' : 'text-negative'}`}>
                 {asset.change >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                 {asset.change}%
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
                <label className="text-xs font-medium text-textMuted uppercase mb-1.5 block">Quantity</label>
                <div className="relative">
                   <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-lg font-bold text-textMain focus:outline-none focus:border-primary/50"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-textMuted font-medium">{asset.symbol}</span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                   <span className="text-textMuted">Available: {ownedQuantity.toFixed(4)} {asset.symbol}</span>
                   <span className="text-textMuted">Max Buy: {Math.floor(balance / asset.price)}</span>
                </div>
             </div>

             <div className="flex justify-between items-center py-4 border-t border-dashed border-border">
                <span className="text-sm text-textMuted">Total Cost</span>
                <span className="text-xl font-bold text-textMain">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>

             <div className="bg-surfaceElevated p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-textMuted">
                   <Wallet className="w-4 h-4" />
                   <span className="text-xs">Wallet Balance</span>
                </div>
                <span className="text-sm font-semibold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
          </div>

          <Button 
            onClick={() => onConfirm(type, qty)} 
            disabled={!isValid}
            className={`w-full py-3 ${type === 'sell' ? 'bg-negative hover:bg-negative/80' : ''}`}
          >
            {type === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
};