import React, { useState, useEffect, useRef } from 'react';
import {
  Users, UserPlus, ArrowLeft, Trophy, Eye, EyeOff,
  TrendingUp, TrendingDown, Wallet, BarChart2, X,
  ChevronUp, ChevronDown, Loader2, AlertCircle, Check, Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { MarketItem } from '../../hooks/useMarket';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  cash_balance: number;
  starting_capital: number;
}

interface PortfolioRow {
  symbol: string;
  amount: number;
  avg_price: number;
}

interface TransactionRow {
  id: string;
  symbol: string;
  asset_name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  purchase_price: number | null;
  profit_loss: number | null;
  created_at: string;
}

interface RankedUser extends UserProfile {
  stockValue: number;
  netWorth: number;
  portfolio: PortfolioRow[];
}

interface AdminUsersProps {
  marketItems: MarketItem[];
}

const STARTING_CAPITAL = 100000;

// Works on HTTP dev and HTTPS prod (crypto.randomUUID requires HTTPS)
const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const formatINR = (v: number) =>
  '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/15 text-yellow-400 font-bold text-sm border border-yellow-500/30">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-400/10 text-zinc-300 font-bold text-sm border border-zinc-500/30">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/15 text-amber-500 font-bold text-sm border border-amber-700/30">3</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface text-textMuted font-semibold text-sm border border-border">{rank}</span>;
};

export const AdminUsers: React.FC<AdminUsersProps> = ({ marketItems }) => {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cleanup state
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; message: string } | null>(null);

  // Detail view
  const [selectedUser, setSelectedUser] = useState<RankedUser | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<'netWorth' | 'stockValue' | 'cash_balance'>('netWorth');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Use a ref for priceMap so fetchUsers doesn't re-run when prices update
  const priceMapRef = useRef<Record<string, number>>({});
  priceMapRef.current = React.useMemo(() => {
    const m: Record<string, number> = {};
    marketItems.forEach(item => { m[item.symbol] = item.price; });
    return m;
  }, [marketItems]);

  // fetchUsers ONLY depends on nothing — uses ref for current prices
  // This prevents auto-refresh whenever market prices tick
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, cash_balance, starting_capital')
        .eq('role', 'participant');
      if (pErr) throw pErr;

      const { data: portfolios, error: portErr } = await supabase
        .from('portfolios')
        .select('user_id, symbol, amount, avg_price');
      if (portErr) throw portErr;

      const portfolioByUser: Record<string, PortfolioRow[]> = {};
      (portfolios || []).forEach((row: any) => {
        if (!portfolioByUser[row.user_id]) portfolioByUser[row.user_id] = [];
        portfolioByUser[row.user_id].push(row);
      });

      const pm = priceMapRef.current;
      const ranked: RankedUser[] = (profiles || []).map((p: UserProfile) => {
        const holdings = portfolioByUser[p.id] || [];
        const stockValue = holdings.reduce((sum, h) => {
          return sum + h.amount * (pm[h.symbol] ?? h.avg_price);
        }, 0);
        return { ...p, stockValue, netWorth: stockValue + p.cash_balance, portfolio: holdings };
      });

      ranked.sort((a, b) => b.netWorth - a.netWorth);
      setUsers(ranked);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount only
  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddUser = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddError('Name, username and password are required');
      return;
    }
    
    if (!supabaseAdmin) {
      setAddError('Admin client not available. Please check VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables.');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      const username = newUsername.trim().toLowerCase();
      const email = `${username}@vsx.local`;
      
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (existingProfile) {
        setAddError('Username already taken');
        setAddLoading(false);
        return;
      }

      // Create auth user first using admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword.trim(),
        email_confirm: true,
        user_metadata: {
          username: username,
          display_name: newName.trim(),
          role: 'participant',
        }
      });

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
          setAddError('User already exists');
        } else {
          throw authError;
        }
        setAddLoading(false);
        return;
      }

      // The database trigger will create a profile, but we need to update it with password and balances
      // Wait a moment for trigger to execute, then update profile
      await new Promise(resolve => setTimeout(resolve, 100));

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          password: newPassword.trim(),
          cash_balance: STARTING_CAPITAL,
          starting_capital: STARTING_CAPITAL,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        // If update fails, try to create profile manually (in case trigger didn't fire)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username,
            display_name: newName.trim(),
            password: newPassword.trim(),
            role: 'participant',
            cash_balance: STARTING_CAPITAL,
            starting_capital: STARTING_CAPITAL,
          });

        if (insertError) {
          // Clean up auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw insertError;
        }
      }

      setAddSuccess(true);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddUser(false);
        fetchUsers();
      }, 1200);
    } catch (e: any) {
      setAddError(e.message?.includes('unique') ? 'Username already taken' : (e.message || 'Failed to create user'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (deleteConfirmId !== userId) {
      setDeleteConfirmId(userId);
      return;
    }

    setDeleteLoading(true);
    setError(null);
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin client not available. Please check VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables.');
      }

      // Delete portfolios and transactions first (use admin client to bypass RLS)
      await supabaseAdmin.from('portfolios').delete().eq('user_id', userId);
      await supabaseAdmin.from('transactions').delete().eq('user_id', userId);
      
      // Delete the auth user — this cascades to delete the profile too
      // (profiles.id references auth.users(id) on delete cascade)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        // If auth user doesn't exist (404), still try to clean up the profile row
        if (authError.status === 404) {
          const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
          if (profileError) throw profileError;
        } else {
          throw new Error(`Failed to delete user: ${authError.message}`);
        }
      }
      
      setDeleteConfirmId(null);
      if (selectedUser?.id === userId) setSelectedUser(null);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      setError(e.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectUser = async (u: RankedUser) => {
    setSelectedUser(u);
    setTxLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false });
    setTransactions((data as TransactionRow[]) || []);
    setTxLoading(false);
  };

  const handleCleanupOrphanedAuthUsers = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    setError(null);

    try {
      let authUserIds: Set<string> = new Set();
      let deletedAuthUsers = 0;
      let deletedProfiles = 0;
      let errorCount = 0;

      // Get all auth users if admin client is available
      if (supabaseAdmin) {
        try {
          const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
          if (authListError) {
            console.warn('Could not list auth users:', authListError.message);
          } else {
            authUserIds = new Set((authUsers?.users || []).map(u => u.id));
            
            // Find orphaned auth users (auth users without profiles)
            const { data: profiles } = await supabase.from('profiles').select('id');
            const profileIds = new Set((profiles || []).map(p => p.id));
            
            const orphanedAuthUsers = (authUsers?.users || []).filter(
              authUser => !profileIds.has(authUser.id)
            );

            // Delete orphaned auth users
            for (const user of orphanedAuthUsers) {
              try {
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                if (deleteError) {
                  console.error(`Failed to delete auth user ${user.id}:`, deleteError);
                  errorCount++;
                } else {
                  deletedAuthUsers++;
                }
                await new Promise(resolve => setTimeout(resolve, 50));
              } catch (err: any) {
                console.error(`Error deleting auth user ${user.id}:`, err);
                errorCount++;
              }
            }
          }
        } catch (err: any) {
          console.warn('Error accessing auth users:', err.message);
        }
      }

      // Get all profiles and find ones without auth users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');
      if (profilesError) throw profilesError;

      // Find orphaned profiles (profiles without auth users)
      // Only check if we have auth user list, otherwise skip
      if (authUserIds.size > 0) {
        const orphanedProfiles = (profiles || []).filter(
          profile => !authUserIds.has(profile.id)
        );

        // Delete orphaned profiles (these are the ones causing 404 errors)
        for (const profile of orphanedProfiles) {
          try {
            // Delete related data first
            await supabaseAdmin.from('portfolios').delete().eq('user_id', profile.id);
            await supabaseAdmin.from('transactions').delete().eq('user_id', profile.id);
            
            // Delete profile
            const { error: deleteError } = await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
            if (deleteError) {
              console.error(`Failed to delete profile ${profile.id}:`, deleteError);
              errorCount++;
            } else {
              deletedProfiles++;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err: any) {
            console.error(`Error deleting profile ${profile.id}:`, err);
            errorCount++;
          }
        }
      }

      const totalDeleted = deletedAuthUsers + deletedProfiles;
      if (totalDeleted === 0 && errorCount === 0) {
        setCleanupResult({ 
          deleted: 0, 
          message: supabaseAdmin 
            ? 'No orphaned users found. Database is clean!' 
            : 'Admin client not available. Could not check for orphaned users.' 
        });
      } else {
        const parts: string[] = [];
        if (deletedAuthUsers > 0) parts.push(`${deletedAuthUsers} orphaned auth users`);
        if (deletedProfiles > 0) parts.push(`${deletedProfiles} orphaned profiles`);
        
        setCleanupResult({
          deleted: totalDeleted,
          message: errorCount > 0
            ? `Cleaned up ${parts.join(' and ')}. ${errorCount} errors occurred.`
            : `Successfully cleaned up ${parts.join(' and ')}.`
        });
      }

      // Refresh user list
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to cleanup orphaned users');
    } finally {
      setCleanupLoading(false);
    }
  };

  const sortedUsers = React.useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return copy;
  }, [users, sortKey, sortDir]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-textMuted opacity-40 inline ml-1" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-primary inline ml-1" />
      : <ChevronUp className="w-3 h-3 text-primary inline ml-1" />;
  };

  // ─── Detail View ──────────────────────────────────────────────────────────
  if (selectedUser) {
    const rank = users.findIndex(u => u.id === selectedUser.id) + 1;
    const pm = priceMapRef.current;
    const plTotal = selectedUser.portfolio.reduce((sum, h) => {
      const curr = pm[h.symbol] ?? h.avg_price;
      return sum + (curr - h.avg_price) * h.amount;
    }, 0);

    return (
      <div className="space-y-6">
        {/* Detail header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textMuted" />
          </button>
          <RankBadge rank={rank} />
          <div>
            <h2 className="text-xl font-bold">{selectedUser.display_name}</h2>
            <p className="text-xs text-textMuted font-mono">@{selectedUser.username}</p>
          </div>
          {/* Delete from detail view */}
          <div className="ml-auto flex items-center gap-2">
            {deleteConfirmId === selectedUser.id && (
              <span className="text-xs text-negative">Confirm delete?</span>
            )}
            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              disabled={deleteLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                deleteConfirmId === selectedUser.id
                  ? 'bg-negative text-white border-negative'
                  : 'bg-negative/5 text-negative border-negative/30 hover:bg-negative/15'
              }`}
            >
              {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deleteConfirmId === selectedUser.id ? 'Yes, Delete' : 'Delete User'}
            </button>
            {deleteConfirmId === selectedUser.id && (
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs text-textMuted hover:text-textMain transition-colors px-2"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Stock Value', value: selectedUser.stockValue, icon: BarChart2, color: 'text-primary' },
            { label: 'Cash Balance', value: selectedUser.cash_balance, icon: Wallet, color: 'text-blue-400' },
            { label: 'Net Worth', value: selectedUser.netWorth, icon: Trophy, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-gradient-to-br from-surface to-surfaceElevated">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-textMuted">{label}</span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight">{formatINR(value)}</div>
            </Card>
          ))}
        </div>

        {/* Holdings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-textMuted" />
            <h3 className="font-semibold">Holdings</h3>
            {plTotal !== 0 && (
              <span className={`ml-auto text-sm font-semibold ${plTotal >= 0 ? 'text-primary' : 'text-negative'}`}>
                {plTotal >= 0 ? '+' : ''}{formatINR(plTotal)} P&L
              </span>
            )}
          </div>
          {selectedUser.portfolio.length === 0 ? (
            <p className="text-textMuted text-sm py-4 text-center">No holdings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Asset', 'Qty', 'Avg Buy', 'Current', 'P&L', 'Total Value'].map(h => (
                      <th key={h} className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider pb-3 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {selectedUser.portfolio.map(h => {
                    const curr = pm[h.symbol] ?? h.avg_price;
                    const pl = (curr - h.avg_price) * h.amount;
                    const totalVal = curr * h.amount;
                    const item = marketItems.find(m => m.symbol === h.symbol);
                    return (
                      <tr key={h.symbol} className="hover:bg-surfaceElevated/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {item?.icon || h.symbol[0]}
                            </div>
                            <div>
                              <div className="font-medium text-textMain">{item?.name || h.symbol}</div>
                              <div className="text-xs text-textMuted">{h.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-textMain">{h.amount}</td>
                        <td className="py-3 pr-4 font-mono text-textMuted">{formatINR(h.avg_price)}</td>
                        <td className="py-3 pr-4 font-mono text-textMain">{formatINR(curr)}</td>
                        <td className={`py-3 pr-4 font-mono font-semibold ${pl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pl >= 0 ? '+' : ''}{formatINR(pl)}
                        </td>
                        <td className="py-3 font-mono font-semibold text-textMain">{formatINR(totalVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Transactions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-textMuted" />
            <h3 className="font-semibold">Transaction History</h3>
          </div>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-textMuted text-sm py-4 text-center">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Type', 'Stock', 'Qty', 'Price', 'Buy Price', 'P&L', 'Time'].map(h => (
                      <th key={h} className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider pb-3 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-surfaceElevated/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          tx.type === 'BUY'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-negative/10 text-negative border border-negative/20'
                        }`}>
                          {tx.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-textMain">{tx.asset_name}</div>
                        <div className="text-xs text-textMuted">{tx.symbol}</div>
                      </td>
                      <td className="py-3 pr-4 font-mono">{tx.quantity}</td>
                      <td className="py-3 pr-4 font-mono">{formatINR(tx.price)}</td>
                      <td className="py-3 pr-4 font-mono text-textMuted">{tx.purchase_price != null ? formatINR(tx.purchase_price) : '—'}</td>
                      <td className={`py-3 pr-4 font-mono font-semibold ${tx.profit_loss == null ? 'text-textMuted' : tx.profit_loss >= 0 ? 'text-primary' : 'text-negative'}`}>
                        {tx.profit_loss != null ? `${tx.profit_loss >= 0 ? '+' : ''}${formatINR(tx.profit_loss)}` : '—'}
                      </td>
                      <td className="py-3 text-xs text-textMuted whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Add User Panel */}
      {showAddUser && (
        <Card className="border border-primary/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">New Participant</h3>
            </div>
            <button onClick={() => { setShowAddUser(false); setAddError(null); setNewName(''); setNewUsername(''); setNewPassword(''); }}
              className="p-1.5 rounded-lg hover:bg-surfaceElevated transition-colors text-textMuted hover:text-textMain">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                placeholder="e.g. Team Alpha"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                placeholder="e.g. team_alpha"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-10 text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 transition-colors text-sm font-mono"
                />
                <button
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-negative text-sm mb-4 bg-negative/5 border border-negative/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {addError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddUser}
              disabled={addLoading || addSuccess}
              className="min-w-[120px]"
            >
              {addSuccess ? (
                <><Check className="w-4 h-4 mr-1" /> Created!</>
              ) : addLoading ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-1" /> Create User</>
              )}
            </Button>
            <p className="text-xs text-textMuted">Starts with ₹1,00,000 balance</p>
          </div>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Participants</h3>
            {!loading && (
              <span className="text-xs text-textMuted bg-surfaceElevated px-2 py-0.5 rounded-full border border-border">
                {users.length} total
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCleanupOrphanedAuthUsers}
              disabled={cleanupLoading}
              title="Remove orphaned auth users (users without profiles)"
            >
              {cleanupLoading ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Cleaning...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-1" /> Cleanup</>
              )}
            </Button>
            <Button
              variant={showAddUser ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => { setShowAddUser(s => !s); setAddError(null); }}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              {showAddUser ? 'Cancel' : 'Add User'}
            </Button>
          </div>
        </div>
        
        {cleanupResult && (
          <div className={`px-5 py-3 border-b border-border ${
            cleanupResult.deleted > 0 ? 'bg-primary/5' : 'bg-surfaceElevated'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {cleanupResult.deleted > 0 ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <AlertCircle className="w-4 h-4 text-textMuted" />
              )}
              <span className={cleanupResult.deleted > 0 ? 'text-primary' : 'text-textMuted'}>
                {cleanupResult.message}
              </span>
              <button
                onClick={() => setCleanupResult(null)}
                className="ml-auto text-textMuted hover:text-textMain transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-negative text-sm">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-textMuted opacity-30" />
            <p className="text-textMuted text-sm">No participants yet</p>
            <p className="text-xs text-textMuted opacity-60">Click "Add User" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surfaceElevated/30">
                  <th className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider px-5 py-3 w-14">Rank</th>
                  <th className="text-left text-xs text-textMuted font-semibold uppercase tracking-wider px-4 py-3">Participant</th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('stockValue')}
                  >
                    <span className={sortKey === 'stockValue' ? 'text-primary' : 'text-textMuted'}>
                      Stock Value <SortIcon col="stockValue" />
                    </span>
                  </th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('cash_balance')}
                  >
                    <span className={sortKey === 'cash_balance' ? 'text-primary' : 'text-textMuted'}>
                      Cash <SortIcon col="cash_balance" />
                    </span>
                  </th>
                  <th
                    className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-textMain transition-colors"
                    onClick={() => handleSort('netWorth')}
                  >
                    <span className={sortKey === 'netWorth' ? 'text-primary' : 'text-textMuted'}>
                      Net Worth <SortIcon col="netWorth" />
                    </span>
                  </th>
                  <th className="text-center text-xs text-textMuted font-semibold uppercase tracking-wider px-5 py-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sortedUsers.map((u) => {
                  const rank = users.indexOf(u) + 1;
                  const pl = u.netWorth - u.starting_capital;
                  const isConfirming = deleteConfirmId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surfaceElevated/40 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <RankBadge rank={rank} />
                      </td>
                      <td
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-primary border border-primary/20 flex-shrink-0">
                            {u.display_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-textMain group-hover:text-primary transition-colors">{u.display_name}</div>
                            <div className="text-xs text-textMuted font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-textMain cursor-pointer" onClick={() => handleSelectUser(u)}>{formatINR(u.stockValue)}</td>
                      <td className="px-4 py-4 text-right font-mono text-textMuted cursor-pointer" onClick={() => handleSelectUser(u)}>{formatINR(u.cash_balance)}</td>
                      <td className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSelectUser(u)}>
                        <div className="font-mono font-bold text-textMain">{formatINR(u.netWorth)}</div>
                        <div className={`text-xs font-semibold font-mono ${pl >= 0 ? 'text-primary' : 'text-negative'}`}>
                          {pl >= 0 ? '+' : ''}{formatINR(pl)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isConfirming ? (
                            <>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteLoading}
                                className="px-2 py-1 bg-negative text-white rounded text-xs font-bold hover:bg-red-600 transition-colors"
                              >
                                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-textMuted hover:text-textMain rounded text-xs transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(u.id); }}
                              className="p-1.5 rounded-lg text-textMuted hover:text-negative hover:bg-negative/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
