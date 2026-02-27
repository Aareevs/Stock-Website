import React from "react";
import {
  LayoutDashboard,
  LineChart,
  Wallet,
  Newspaper,
  Shield,
  Search,
} from "lucide-react";

import type { SimState } from "../../hooks/useMarket";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
  currentUserName?: string;
  simState: SimState;
  elapsedSeconds: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  currentUserName,
  simState,
  elapsedSeconds,
}) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: LineChart, label: "Markets" },
    { icon: Wallet, label: "Portfolio" },
    { icon: Newspaper, label: "News Events" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen sticky top-0 border-r border-border bg-background pt-6 pb-4 transition-all duration-300">
      <div className="px-3 mb-10 flex items-center justify-center lg:justify-start gap-2">
        <img src="/vsx-logo.png" alt="VSX" className="h-14 flex-shrink-0" />
        <span className="text-xs font-bold tracking-wider text-primary hidden lg:block uppercase">
          VSX
        </span>
      </div>

      <div className="px-4 mb-6 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group focus:outline-none ${
              activeTab === item.label
                ? "bg-surfaceElevated text-primary"
                : "text-textMuted hover:text-textMain hover:bg-surface/50"
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${activeTab === item.label ? "text-primary" : "text-textMuted group-hover:text-textMain"}`}
            />
            <span className="font-medium hidden lg:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 mt-auto space-y-1 border-t border-border pt-4">
        {currentUserName && (
          <div className="px-3 py-2 mb-2 hidden lg:block">
            <span className="text-xs text-textMuted block">Logged in as</span>
            <span className="text-sm font-semibold text-textMain truncate block">
              {currentUserName}
            </span>
          </div>
        )}

        {/* Event Timer in Sidebar */}
        {simState !== 'idle' && (
          <div className="mx-3 my-4 px-3 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5" style={{ animation: simState === 'running' ? 'pulse 2s infinite' : 'none' }}>
            <span className="text-[10px] text-amber-500/80 block mb-1 font-bold tracking-widest uppercase text-center hidden lg:block">
              Event Timer
            </span>
            <div className="font-mono font-bold text-amber-400 text-center text-sm lg:text-lg tracking-wider">
              {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
