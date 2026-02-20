import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { StockDataPoint } from '../../types';

interface MainChartProps {
  data: StockDataPoint[];
}

export const MainChart: React.FC<MainChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1ED3A6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#1ED3A6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8FA6A0', fontSize: 12 }} 
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8FA6A0', fontSize: 12 }}
            tickFormatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18211E', borderColor: '#1F2A26', borderRadius: '8px', color: '#E6F1EE' }}
            itemStyle={{ color: '#1ED3A6' }}
            formatter={(value: number) => [`₹${(value ?? 0).toFixed(2)}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#1ED3A6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Upgraded graphical sparkline (filled area instead of plain line)
interface MiniSparklineProps {
  data: { value: number; time?: string }[];
  color?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ data, color = '#1ED3A6' }) => {
  const gradientId = React.useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  // Compute tight Y-axis domain to exaggerate price movement visibility
  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  // Add 20% padding so the line doesn't touch edges; if range is 0, use ±1% of price
  const padding = range > 0 ? range * 0.2 : minVal * 0.01;
  const yDomain: [number, number] = [minVal - padding, maxVal + padding];

  return (
    <div className="w-full h-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <YAxis domain={yDomain} hide />
          <Area 
            type="natural" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Keep old MiniChart for backward compat
interface MiniChartProps {
  data: { value: number }[];
  color?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, color = '#1ED3A6' }) => {
  return <MiniSparkline data={data} color={color} />;
};

interface SentimentChartProps {
  data: { name: string; value: number; color: string }[];
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[200px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-textMain">53%</span>
        <span className="text-xs text-textMuted uppercase tracking-wider">Bullish</span>
      </div>
    </div>
  );
};

// Full stock chart with volume bars
interface StockChartProps {
  data: StockDataPoint[];
  color?: string;
}

export const StockChart: React.FC<StockChartProps> = ({ data, color = '#1ED3A6' }) => {
  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const chartColor = isPositive ? '#1ED3A6' : '#EF4444';

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8FA6A0', fontSize: 10 }}
            minTickGap={50}
          />
          <YAxis
            domain={['auto', 'auto']}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8FA6A0', fontSize: 11 }}
            tickFormatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18211E', borderColor: '#1F2A26', borderRadius: '8px', color: '#E6F1EE' }}
            itemStyle={{ color: chartColor }}
            formatter={(value: number) => [`₹${(value ?? 0).toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#stockGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};