import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ADMIN_CREDENTIALS } from '../../data/users';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin();
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors">
            <ArrowLeft className="w-5 h-5 text-textMuted" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-textMain">Admin Panel</h1>
            <p className="text-xs text-textMuted">Authorized access only</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textMuted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain focus:outline-none focus:border-primary/50"
              placeholder="Enter admin username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textMuted mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-textMain focus:outline-none focus:border-primary/50 pr-10"
                placeholder="Enter admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-negative text-sm bg-negative/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <Button type="submit" className="w-full py-3">
            <Shield className="w-4 h-4 mr-2" /> Access Admin Panel
          </Button>
        </form>
      </Card>
    </div>
  );
};
