import React, { useState, useMemo } from "react";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { MarketItem } from "../../types";
import { StockChart } from "./Charts";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const COMPANY_LOGOS: Record<string, string> = {
  VELOCITY: "/VelocityAuto.png",
  APEXAUTO: "/ApexAutomotive.png",
  CRUISER: "/CruiserDynamics.png",
  VITALIS: "/VitalisHealth.png",
  CAREPLUS: "/CarePlus.png",
  MEDISURG: "/Medisurge Pharma.png",
  EDUNEXT: "/EduNext.png",
  SCHOLAR: "/ScholarStream.png",
  BRAINB: "/BrainBoost.png",
  FRESHC: "/FreshCrave Foods.png",
  SPICER: "/SpiceRoute Dining.png",
  URBANB: "/UrbanBites.png",
};

type Timeframe = "1m" | "5m" | "10m" | "30m" | "overall";

const TICK_MAP: Record<Exclude<Timeframe, "overall">, number> = {
  "1m": 60,
  "5m": 300,
  "10m": 600,
  "30m": 1800,
};

interface StockDetailChartProps {
  stock: MarketItem;
  onBack: () => void;
  ownedQty: number;
  avgPrice: number;
  onTrade: () => void;
}

export const StockDetailChart: React.FC<StockDetailChartProps> = ({
  stock,
  onBack,
  ownedQty,
  avgPrice,
  onTrade,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("overall");

  const isPositive = (stock.change ?? 0) >= 0;
  const currentValue = ownedQty * (stock.price ?? 0);
  const pnl = ownedQty > 0 ? ((stock.price ?? 0) - avgPrice) * ownedQty : 0;

  // O(n) slice — no mutation, no deep clone
  const visibleData = useMemo(() => {
    const history = stock.priceHistory;
    if (!history || history.length === 0) return [];
    if (timeframe === "overall") return history;

    const count = TICK_MAP[timeframe];
    return history.slice(-count);
  }, [stock.priceHistory, timeframe]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-textMuted" />
        </button>
        <div className="w-12 h-12 rounded-full bg-surfaceElevated border border-border flex items-center justify-center overflow-hidden">
          <img
            src={COMPANY_LOGOS[stock.symbol] || ""}
            alt={stock.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textMain">{stock.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-textMuted">
              {stock.symbol}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surfaceElevated border border-border text-[10px] font-semibold text-textMuted uppercase tracking-wider">
              {stock.sector}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-textMain">
            ₹
            {(stock.price ?? 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? "text-primary" : "text-negative"}`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {isPositive ? "+" : ""}
            {(stock.change ?? 0).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Timeframe Controls */}
      <div className="flex gap-2">
        {(["1m", "5m", "10m", "30m", "overall"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              timeframe === tf
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "bg-surface border border-border text-textMuted hover:text-textMain hover:border-primary/30"
            }`}
          >
            {tf === "overall" ? "Overall" : tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card padding="sm">
        <StockChart data={visibleData} />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-textMuted mb-1">Open</div>
          <div className="font-mono font-bold">
            {visibleData.length > 0
              ? `₹${visibleData[0].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">High</div>
          <div className="font-mono font-bold text-primary">
            {visibleData.length > 0
              ? `₹${Math.max(...visibleData.map((p) => p.value)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">Low</div>
          <div className="font-mono font-bold text-negative">
            {visibleData.length > 0
              ? `₹${Math.min(...visibleData.map((p) => p.value)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-textMuted mb-1">Sentiment</div>
          <div
            className={`font-bold ${stock.sentiment === "Bullish" ? "text-primary" : stock.sentiment === "Bearish" ? "text-negative" : "text-textMuted"}`}
          >
            {stock.sentiment}
          </div>
        </Card>
      </div>

      {/* Your Position */}
      {ownedQty > 0 && (
        <Card className="bg-gradient-to-r from-surface to-surfaceElevated">
          <h3 className="text-sm font-semibold text-textMuted mb-3">
            Your Position
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-textMuted">Quantity</div>
              <div className="font-mono font-bold">{ownedQty.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-textMuted">Avg Buy Price</div>
              <div className="font-mono font-bold">
                ₹
                {avgPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-textMuted">Current Value</div>
              <div className="font-mono font-bold">
                ₹
                {currentValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-textMuted">P&L</div>
              <div
                className={`font-mono font-bold ${pnl >= 0 ? "text-primary" : "text-negative"}`}
              >
                {pnl >= 0 ? "+" : ""}₹
                {pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Trade Button */}
      <div className="flex justify-center">
        <Button onClick={onTrade} className="px-10 py-3 text-lg">
          Trade {stock.symbol}
        </Button>
      </div>
    </div>
  );
};
