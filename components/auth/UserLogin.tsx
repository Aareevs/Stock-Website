import React, { useState, useEffect, useRef } from 'react';
import { LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from './AuthProvider';

interface UserLoginProps {
  onOpenAdmin: () => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onOpenAdmin }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const chars = '₹$%&@#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト▲▼◆►◄';
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 14, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#1ED3A6';
          ctx.shadowBlur = 20;
        } else if (brightness > 0.7) {
          ctx.fillStyle = '#1ED3A6';
          ctx.shadowColor = '#1ED3A6';
          ctx.shadowBlur = 10;
        } else if (brightness > 0.3) {
          ctx.fillStyle = `rgba(30, 211, 166, ${0.3 + brightness * 0.3})`;
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(30, 211, 166, ${0.05 + brightness * 0.15})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4 + Math.random() * 0.6;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const dummyEmail = `${username.toLowerCase().replace(/\s+/g, '')}@vsx.local`;

    if (isSignUp) {
      if (!username || !displayName) {
        setError('All fields are required');
        setIsLoading(false);
        return;
      }
      // Pass the dummy email to Supabase
      const { error: err } = await signUp(dummyEmail, password, username, displayName);
      if (err) setError(err);
      else setSignUpSuccess(true);
    } else {
      // Login with dummy email
      const { error: err } = await signIn(dummyEmail, password);
      // specific error handling for invalid login
      if (err) {
        if (err.includes("Invalid login credentials")) {
          setError("Invalid username or password");
        } else {
          setError(err);
        }
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Matrix Rain Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ opacity: 0.8 }} />
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/40 via-transparent to-background/70" />

      {/* Tech Fest Logo */}
      <img src="/techfest-logo.png" alt="Tech Fest" className="absolute top-6 left-6 h-12 z-20 drop-shadow-lg" />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="max-w-md text-center space-y-6 px-12">
          <img src="/vsx-logo.png" alt="VSX: Buy or Bail" className="h-56 mx-auto drop-shadow-2xl" />
          <p className="text-lg text-textMuted leading-relaxed">
            Compete with 40 players in the ultimate stock trading showdown. Start with ₹10 Cr — buy smart or bail fast.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">40</div>
              <div className="text-xs text-textMuted mt-1">Players</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-textMuted mt-1">Stocks</div>
            </div>
            <div className="bg-surface/50 backdrop-blur border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
              <div className="text-2xl font-bold text-primary">₹10Cr</div>
              <div className="text-xs text-textMuted mt-1">Starting Capital</div>
            </div>
          </div>

          <div className="relative h-20 mt-6 opacity-30">
            <svg viewBox="0 0 400 80" className="w-full h-full">
              <path d="M0,60 Q50,40 100,50 T200,30 T300,45 T400,20" fill="none" stroke="#1ED3A6" strokeWidth="2" className="animate-pulse" />
              <path d="M0,70 Q80,50 150,60 T250,40 T350,55 T400,35" fill="none" stroke="#1ED3A6" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">
              VSX: <span className="text-primary">Buy or Bail</span>
            </h1>
          </div>

          <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-black/20">
            {signUpSuccess ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-textMain">Account Created!</h2>
                <p className="text-sm text-textMuted">Admin approval required. Please wait for activation.</p>
                <Button onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }} className="mt-4">
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-textMain mb-2">
                    {isSignUp ? 'Create Account' : 'Welcome!'}
                  </h2>
                  <p className="text-sm text-textMuted">
                    {isSignUp ? 'Sign up to start trading' : 'Enter your credentials to access the trading floor'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <>
                      {/* Removed separate Username input here as it's now the main input below */}
                      <div>
                        <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                          className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                          placeholder="Your display name"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    {/* Changed label from Email to Username */}
                    <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Username</label>
                    <input
                      type="text" // Changed from email to text
                      value={username} // Bound to username state
                      onChange={(e) => { setUsername(e.target.value); setError(''); }} // Updates username state
                      className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      placeholder="Enter username"
                      autoComplete="username"
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
                        className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                        placeholder="Enter your password"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors">
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

                  <Button type="submit" disabled={!username || !password || isLoading}
                    className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setSignUpSuccess(false); }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <button onClick={onOpenAdmin}
                    className="w-full text-center text-xs text-textMuted hover:text-primary transition-colors py-2">
                    Admin Access →
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-textMuted/50 mt-6">
            VSX: Buy or Bail • 40 Players • Real-time Simulation
          </p>
        </div>
      </div>
    </div>
  );
};
