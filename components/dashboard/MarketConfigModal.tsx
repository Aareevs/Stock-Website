import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { MarketItem } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface MarketConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItems: MarketItem[];
  onSave: (items: MarketItem[]) => void;
}

export const MarketConfigModal: React.FC<MarketConfigModalProps> = ({
  isOpen,
  onClose,
  currentItems,
  onSave,
}) => {
  const [items, setItems] = useState<MarketItem[]>(currentItems);

  useEffect(() => {
    setItems(currentItems);
  }, [currentItems, isOpen]);

  const handleChange = (index: number, field: keyof MarketItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setItems([
      ...items,
      {
        name: "New Company",
        symbol: "NEW",
        price: 100,
        change: 0,
        sentiment: "Neutral",
        icon: "N",
      },
    ]);
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card
        className="w-full max-w-3xl max-h-[90vh] flex flex-col p-6"
        padding="none"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-textMain">
            Manage Market Companies
          </h2>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-textMain"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-end bg-surfaceElevated/50 p-4 rounded-lg"
            >
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  value={item.symbol}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 5);
                    handleChange(index, "symbol", val);
                    if (val.length > 0) handleChange(index, "icon", val[0]);
                  }}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Initial Price ($)
                </label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleChange(
                      index,
                      "price",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-xs font-medium text-textMuted mb-1">
                  Sentiment
                </label>
                <select
                  value={item.sentiment}
                  onChange={(e) =>
                    handleChange(index, "sentiment", e.target.value)
                  }
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-textMain focus:border-primary outline-none text-sm"
                >
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
              <div className="col-span-6 md:col-span-1 flex justify-end">
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 text-negative hover:bg-negative/10 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <Button
            variant="secondary"
            onClick={handleAdd}
            className="w-full border-dashed border-2 border-border hover:border-primary bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Company
          </Button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
};
