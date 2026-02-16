import React, { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { User } from '../../types';

interface UserLoginProps {
  users: User[];
  onLogin: (userId: string) => void;
  onOpenAdmin: () => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ users, onLogin, onOpenAdmin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (user) {
        onLogin(user.id);
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Tech Fest Logo - Top Left Corner */}
      <img src="/techfest-logo.png" alt="Tech Fest" className="absolute top-6 left-6 h-12 z-20 drop-shadow-lg" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="max-w-md text-center space-y-6 px-12">
          <img src="/vsx-logo.png" alt="VSX: Buy or Bail" className="h-56 mx-auto drop-shadow-2xl" />
          <p className="text-lg text-textMuted leading-relaxed">
            Compete with 40 players in the ultimate stock trading showdown. Start with ₹10 Cr — buy smart or bail fast.
          </p>

          {/* Floating Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-surface/50 backdrop-blur border border-border/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">40</div>
              <div className="text-xs text-textMuted mt-1">Players</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-border/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-textMuted mt-1">Stocks</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-border/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">₹10Cr</div>
              <div className="text-xs text-textMuted mt-1">Starting Capital</div>
            </div>
          </div>

          {/* Decorative Chart Lines */}
          <div className="relative h-20 mt-6 opacity-30">
            <svg viewBox="0 0 400 80" className="w-full h-full">
              <path
                d="M0,60 Q50,40 100,50 T200,30 T300,45 T400,20"
                fill="none"
                stroke="#1ED3A6"
                strokeWidth="2"
                className="animate-pulse"
              />
              <path
                d="M0,70 Q80,50 150,60 T250,40 T350,55 T400,35"
                fill="none"
                stroke="#1ED3A6"
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">
              VSX: <span className="text-primary">Buy or Bail</span>
            </h1>
          </div>

          <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-black/20">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-textMain mb-2">Welcome!</h2>
              <p className="text-sm text-textMuted">Enter your credentials to access the trading floor</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3.5 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 pr-12"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-negative text-sm bg-negative/10 border border-negative/20 px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!username || !password || isLoading}
                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <button
                onClick={onOpenAdmin}
                className="w-full text-center text-xs text-textMuted hover:text-primary transition-colors py-2"
              >
                Admin Access →
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-textMuted/50 mt-6">
            VSX: Buy or Bail • 40 Players • Real-time Simulation
          </p>
        </div>
      </div>
    </div>
  );
};
