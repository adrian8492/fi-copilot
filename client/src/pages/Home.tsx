import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Mic, Shield, TrendingUp, Zap, Star, BarChart2 } from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Real-Time Transcription",
    desc: "Every word captured live — F&I manager and customer — with speaker separation and confidence scoring.",
  },
  {
    icon: Zap,
    title: "AI Co-Pilot Suggestions",
    desc: "Contextual prompts delivered mid-conversation: objection scripts, product recommendations, closing cues.",
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    desc: "Automatic flagging of ECOA, TILA, GLBA, and state-specific disclosure requirements in real time.",
  },
  {
    icon: Star,
    title: "Proprietary Grading Engine",
    desc: "Asura's rubric scores rapport, product presentation, objection handling, and closing technique.",
  },
  {
    icon: TrendingUp,
    title: "Coaching Reports",
    desc: "AI-generated post-session analysis with sentiment scoring, key moments, and personalized recommendations.",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    desc: "Track score trends, PVR correlation, product utilization, and benchmark against team averages.",
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (!loading && isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground tracking-tight">F&I Co-Pilot</span>
          <span className="text-xs text-muted-foreground ml-1">by Asura Group</span>
        </div>
        <Button onClick={() => window.location.href = getLoginUrl()} size="sm">
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Proprietary AI Platform — Asura Group
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight max-w-3xl">
          The AI Co-Pilot Built for<br />
          <span className="text-primary">Elite F&I Performance</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Real-time transcription, compliance monitoring, and AI-powered coaching — purpose-built for automotive Finance & Insurance professionals.
        </p>
        <div className="flex items-center gap-3">
          <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="gap-2">
            <Mic className="w-4 h-4" /> Get Started
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Asura Group. All rights reserved. Proprietary platform — not for redistribution.</p>
      </footer>
    </div>
  );
}
