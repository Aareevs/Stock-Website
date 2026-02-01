import React from 'react';
import { Button } from '../ui/Button';
import { ArrowRight, BarChart, Globe, Shield, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { APP_NAME } from '../../constants';
import { Card } from '../ui/Card';

interface LandingPageProps {
  onLogin: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 transition-all duration-300 backdrop-blur-md bg-background/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-primary shadow-[0_0_10px_rgba(30,211,166,0.5)]"></div>
             <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textMuted">
            <a href="#" className="hover:text-textMain transition-colors">Products</a>
            <a href="#" className="hover:text-textMain transition-colors">Community</a>
            <a href="#" className="hover:text-textMain transition-colors">Markets</a>
            <a href="#" className="hover:text-textMain transition-colors">News</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenAuth} className="text-sm font-medium hover:text-primary transition-colors">Log In</button>
            <Button onClick={onOpenAuth} size="sm" className="shadow-[0_0_20px_rgba(30,211,166,0.3)]">Get started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1614726365723-49faaa55bb89?q=80&w=2600&auto=format&fit=crop" 
            alt="Space Tech Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Market Data 2.0
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              Look first <span className="text-textMuted">/</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Then leap.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-textMuted max-w-2xl mx-auto font-light leading-relaxed">
              The best trades require research, then commitment. 
              <br className="hidden md:block"/> Unlock institutional-grade analytics for the modern era.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button onClick={onOpenAuth} size="lg" className="min-w-[200px] text-lg">
                Get started for free
              </Button>
              <button onClick={onOpenAuth} className="flex items-center gap-2 px-6 py-4 rounded-full border border-border bg-surface/50 backdrop-blur hover:bg-surface/80 transition-all text-textMain font-medium">
                <Globe className="w-5 h-5 text-primary" />
                Explore Markets
              </button>
            </div>

            <p className="text-xs text-textMuted pt-4 opacity-70">
              $0 forever, no credit card needed for basic tier.
            </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-textMuted">
            <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-border bg-surface/30 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { label: 'Active Traders', value: '2M+' },
                    { label: 'Data Points', value: '50B' },
                    { label: 'Markets Tracked', value: '150K' },
                    { label: 'Uptime', value: '99.9%' }
                ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm text-textMuted uppercase tracking-wider font-semibold">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold">Precision at your fingertips</h2>
                  <p className="text-textMuted text-lg">
                      Our dashboard consolidates the chaos of the market into actionable signals.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                  {[
                      { 
                          icon: TrendingUp, 
                          title: "Real-time Analytics", 
                          desc: "Streaming data with millisecond latency. Don't trade on yesterday's news.",
                          visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border">
                                <div className="absolute inset-0 flex items-center px-4">
                                    <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-2/3 rounded-full"></div>
                                    </div>
                                </div>
                             </div>
                          )
                      },
                      { 
                          icon: Shield, 
                          title: "Institutional Security", 
                          desc: "Enterprise-grade encryption and data protection protocols for your peace of mind.",
                          visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <div className="text-xs font-mono text-green-500">ENCRYPTED</div>
                             </div>
                          )
                      },
                      { 
                          icon: Zap, 
                          title: "Sentiment Analysis", 
                          desc: "AI-driven social sentiment tracking to predict market movements before they happen.",
                           visual: (
                             <div className="h-24 w-full mt-4 relative overflow-hidden rounded-lg bg-background border border-border flex items-end justify-center px-2 pb-2 gap-1">
                                {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                    <div key={i} className="w-3 bg-primary/50 rounded-sm" style={{ height: `${h}%`}}></div>
                                ))}
                             </div>
                          )
                      }
                  ].map((feature, i) => (
                      <Card key={i} className="group hover:border-primary/50 transition-colors duration-300">
                          <div className="h-12 w-12 rounded-lg bg-surfaceElevated flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                              <feature.icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                          <p className="text-textMuted leading-relaxed mb-4">{feature.desc}</p>
                          {feature.visual}
                      </Card>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto relative">
              <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full"></div>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-b from-surfaceElevated to-surface text-center py-16 md:py-24 px-6">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to start your journey?</h2>
                  <p className="text-textMuted text-lg max-w-2xl mx-auto mb-10">
                      Join thousands of traders who have switched to {APP_NAME} for better insights and faster execution.
                  </p>
                  <Button onClick={onOpenAuth} size="lg" className="min-w-[200px] shadow-[0_0_30px_rgba(30,211,166,0.4)]">
                      Create free account
                  </Button>
              </Card>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-16 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                        <div className="w-5 h-5 rounded bg-primary"></div>
                        <span className="text-lg font-bold">{APP_NAME}</span>
                  </div>
                  <p className="text-textMuted max-w-xs mb-6">
                      Empowering traders with data-driven insights and professional tools.
                  </p>
                  <div className="flex gap-4">
                      {/* Social icons placeholders */}
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">𝕏</div>
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">in</div>
                      <div className="w-8 h-8 rounded-full bg-surfaceElevated border border-border flex items-center justify-center hover:border-primary cursor-pointer transition-colors">Ig</div>
                  </div>
              </div>
              
              {[
                  { title: "Platform", links: ["Markets", "Analytics", "Screeners", "Mobile App"] },
                  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
                  { title: "Resources", links: ["Help Center", "API Docs", "Community", "Blog"] }
              ].map((col, i) => (
                  <div key={i}>
                      <h4 className="font-bold mb-6 text-white">{col.title}</h4>
                      <ul className="space-y-4 text-sm text-textMuted">
                          {col.links.map(link => (
                              <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-sm text-textMuted gap-4">
              <p>© 2024 {APP_NAME} Inc. All rights reserved.</p>
              <div className="flex gap-6">
                  <a href="#" className="hover:text-white">Privacy Policy</a>
                  <a href="#" className="hover:text-white">Terms of Service</a>
              </div>
          </div>
      </footer>
    </div>
  );
};