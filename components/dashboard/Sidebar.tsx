import React from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  Newspaper, 
  Users, 
  Settings, 
  LogOut,
  Search
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview' },
    { icon: LineChart, label: 'Markets' },
    { icon: Wallet, label: 'Portfolio' },
    { icon: Newspaper, label: 'News Feed' },
    { icon: Users, label: 'Community' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen sticky top-0 border-r border-border bg-background pt-6 pb-4 transition-all duration-300">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex-shrink-0" />
        <span className="text-xl font-bold tracking-tight text-textMain hidden lg:block">NovaTrade</span>
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.label
                ? 'bg-surfaceElevated text-primary border border-border' 
                : 'text-textMuted hover:text-textMain hover:bg-surface/50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.label ? 'text-primary' : 'text-textMuted group-hover:text-textMain'}`} />
            <span className="font-medium hidden lg:block">{item.label}</span>
            {item.label === 'News Feed' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-primary hidden lg:block" />
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 mt-auto space-y-1 border-t border-border pt-4">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-textMuted hover:text-textMain hover:bg-surface/50 transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium hidden lg:block">Settings</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-textMuted hover:text-negative/80 hover:bg-negative/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium hidden lg:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};