/**
 * UserLogin Component
 *
 * Full-screen login page for regular (non-admin) users.
 * Features a cinematic Matrix-rain canvas animation on the background,
 * split-panel layout with branding on the left and a login form on the right.
 *
 * Props:
 *   - onOpenAdmin: callback to navigate to the Admin login page
 */

import React, { useState, useEffect, useRef } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "./AuthProvider";

// ---------- Types ----------

interface UserLoginProps {
  onOpenAdmin: () => void;
}

// ---------- Component ----------

export const UserLogin: React.FC<UserLoginProps> = ({ onOpenAdmin }) => {
  // Auth context — provides the signIn method
  const { signIn } = useAuth();

  // ---------- Local State ----------
  const [password, setPassword] = useState(""); // Password field value
  const [username, setUsername] = useState(""); // Username field value
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [error, setError] = useState(""); // Error message from auth
  const [isLoading, setIsLoading] = useState(false); // Loading spinner state
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for the Matrix rain <canvas>

  // ---------- Matrix Rain Background Effect ----------
  // Renders a falling-characters animation on a full-screen canvas.
  // Characters include currency symbols, alphanumerics, and Japanese katakana
  // for a cyberpunk / stock-market aesthetic.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Character set used for the rain drops
    const chars =
      "₹$%&@#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト▲▼◆►◄";
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    // Resize handler — recalculates column count & resets drop positions
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      // Start drops at random negative offsets so they stagger on load
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    };

    resize();
    window.addEventListener("resize", resize);

    // Core draw loop — called every animation frame
    const draw = () => {
      // Semi-transparent fill creates the fading trail effect
      ctx.fillStyle = "rgba(10, 14, 20, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        // Pick a random character from the set
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary brightness randomly for a flickering glow effect
        const brightness = Math.random();
        if (brightness > 0.95) {
          // Rare bright white flash — "lead" character
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "#1ED3A6";
          ctx.shadowBlur = 20;
        } else if (brightness > 0.7) {
          // Bright primary green
          ctx.fillStyle = "#1ED3A6";
          ctx.shadowColor = "#1ED3A6";
          ctx.shadowBlur = 10;
        } else if (brightness > 0.3) {
          // Medium opacity green
          ctx.fillStyle = `rgba(30, 211, 166, ${0.3 + brightness * 0.3})`;
          ctx.shadowBlur = 0;
        } else {
          // Faint, nearly invisible green — background depth
          ctx.fillStyle = `rgba(30, 211, 166, ${0.05 + brightness * 0.15})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0; // Reset shadow after each character

        // Reset drop to top once it falls past the viewport (with randomness)
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        // Advance drop position — variable speed for organic feel
        drops[i] += 0.4 + Math.random() * 0.6;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup — cancel animation loop and remove resize listener on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ---------- Form Submission Handler ----------
  // Authenticates the user via Supabase through the AuthProvider signIn method.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: err } = await signIn(username, password);
    if (err) {
      setError(err);
    }
    setIsLoading(false);
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* ===== Background Layer ===== */}
      {/* Full-screen canvas for the Matrix rain animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0.8 }}
      />
      {/* Gradient overlay to soften the canvas and improve text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/40 via-transparent to-background/70" />

      {/* ===== Sponsor Logos (top corners) ===== */}
      {/* Tech Fest logo — top left */}
      <img
        src="/techfest-logo.png"
        alt="Tech Fest"
        className="absolute top-12 left-12 h-9 z-20 drop-shadow-lg"
      />
      {/* Vedam School of Technology logo — top right */}
      <img
        src="/vedam-logo.png"
        alt="Vedam School of Technology"
        className="absolute top-11 right-12 h-8 z-20 drop-shadow-lg"
      />

      {/* ===== Left Panel — Branding & Info (visible on large screens only) ===== */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="max-w-md text-center space-y-6 px-12">
          {/* Main VSX logo */}
          <img
            src="/vsx-logo.png"
            alt="VSX: Buy or Bail"
            className="h-56 mx-auto drop-shadow-2xl"
          />
          {/* Tagline */}
          <p className="text-lg text-textMuted leading-relaxed">
            Compete with 40 players in the ultimate stock trading showdown.
            Start with ₹1 Lakh — buy smart or bail fast.
          </p>

          {/* Quick stats — Players, Stocks, Starting Capital */}
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
              <div className="text-2xl font-bold text-primary">₹1L</div>
              <div className="text-xs text-textMuted mt-1">
                Starting Capital
              </div>
            </div>
          </div>

          {/* Decorative SVG stock-chart lines */}
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

      {/* ===== Right Panel — Login Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile-only header (hidden on desktop where the left panel shows branding) */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">
              VSX: <span className="text-primary">Buy or Bail</span>
            </h1>
          </div>

          {/* Login Card */}
          <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-black/20">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-textMain mb-2">
                Welcome!
              </h2>
              <p className="text-sm text-textMuted">
                Enter your credentials to access the trading floor
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password Input with show/hide toggle */}
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-surfaceElevated/50 border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {/* Eye icon toggle for password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Banner — shown when authentication fails */}
              {error && (
                <div className="flex items-center gap-2 text-negative text-sm bg-negative/10 border border-negative/20 px-4 py-3 rounded-xl">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button — disabled while loading or if fields are empty */}
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

            {/* Admin Access Link — navigates to the separate Admin login page */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <button
                onClick={onOpenAdmin}
                className="w-full text-center text-xs text-textMuted hover:text-primary transition-colors py-2"
              >
                Admin Access →
              </button>
            </div>
          </div>

          {/* Footer tagline */}
          <p className="text-center text-xs text-textMuted/50 mt-6">
            VSX: Buy or Bail • 40 Players • Real-time Simulation
          </p>
        </div>
      </div>
    </div>
  );
};
