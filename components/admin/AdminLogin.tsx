import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../auth/AuthProvider';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const { signInAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Login directly with username and password
    const { error: err } = await signInAdmin(username, password);
    if (err) {
      setError(err);
      setIsLoading(false);
      return;
    }

    // Check if the user has admin role — done via AuthProvider
    // The App.tsx will check isAdmin and route accordingly
    setIsLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-textMain">Admin Panel</h2>
              <p className="text-xs text-textMuted">Restricted access — admin credentials required</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Username or Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                placeholder="Enter admin username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all pr-12"
                  placeholder="Admin password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm bg-negative/10 border border-negative/20 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Button type="submit" disabled={!username || !password || isLoading}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access Admin Panel
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
