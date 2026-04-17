import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Printer,
  Timer,
  Lightbulb,
  BookOpen,
  Eye,
  EyeOff,
} from "lucide-react";

type Category = "All" | "Price/Payment" | "Product Value" | "Trust/Dealership" | "I Already Have It" | "Timing/Urgency" | "Credit/Approval";

interface Objection {
  id: number;
  objection: string;
  category: Exclude<Category, "All">;
  difficulty: number;
  response: string;
  underlyingConcern: string;
}

const CATEGORIES: Category[] = ["All", "Price/Payment", "Product Value", "Trust/Dealership", "I Already Have It", "Timing/Urgency", "Credit/Approval"];

const OBJECTIONS: Objection[] = [
  // Price/Payment (5)
  { id: 1, objection: "My payment is already too high, I can't add anything else.", category: "Price/Payment", difficulty: 2, response: "I completely understand wanting to keep your payment manageable. Let me show you how these protections actually save you money. Without GAP coverage for example, if something happens to this vehicle, you could owe thousands more than insurance pays. We're talking about pennies a day to protect thousands of dollars.", underlyingConcern: "Fear of overextending budget; anxiety about total financial commitment." },
  { id: 2, objection: "Just give me the lowest payment possible.", category: "Price/Payment", difficulty: 3, response: "I want to get you the best value, not just the lowest number. The lowest payment today could actually cost you more tomorrow if you're not protected. Let me show you what happens if your engine fails at 45,000 miles with no coverage — that's a $6,000 repair on top of your payments.", underlyingConcern: "Short-term thinking; doesn't yet see long-term cost implications." },
  { id: 3, objection: "That's way too expensive for a warranty.", category: "Price/Payment", difficulty: 3, response: "I hear you. Let me put this in perspective — the average engine replacement costs $5,500, a transmission is $4,200. This coverage is about $2.10 a day. You're not buying a warranty, you're buying the right to never worry about a repair bill on this vehicle.", underlyingConcern: "Price anchoring without context; needs reframing around cost vs. risk." },
  { id: 4, objection: "Can you just knock $500 off the price?", category: "Price/Payment", difficulty: 2, response: "I wish I could, but here's what I can do — I can structure these products so you're actually protected and your monthly impact is minimal. Let's look at which protections give you the most value for your specific driving situation.", underlyingConcern: "Negotiation reflex; testing whether there's room to move on price." },
  { id: 5, objection: "I'll just pay cash for repairs if something breaks.", category: "Price/Payment", difficulty: 4, response: "A lot of people feel that way until the first major repair hits. The average new car owner spends over $3,000 in unexpected repairs in the first 5 years. With a service contract, you're locking in a known cost today vs. an unknown — and potentially much larger — cost later.", underlyingConcern: "Overconfidence in financial reserves; underestimating repair probability." },

  // Product Value (5)
  { id: 6, objection: "I don't need a service contract, this car is brand new.", category: "Product Value", difficulty: 3, response: "That's exactly when you want to secure coverage — while you can get it at the best rate. Factory warranty covers you for a few years, but most expensive repairs happen between years 4-7. By then, you can't get coverage or it costs twice as much. Right now, you lock in today's rate.", underlyingConcern: "Misunderstanding of factory warranty duration and coverage limits." },
  { id: 7, objection: "I've never used a warranty before, so it's a waste of money.", category: "Product Value", difficulty: 3, response: "That's actually great — it means your previous vehicles were reliable. But this vehicle has 47 computer modules, 6 cameras, and technology that didn't exist 5 years ago. The complexity means repair costs are significantly higher than what you've experienced before.", underlyingConcern: "Anchoring on past experience; unaware of modern vehicle complexity." },
  { id: 8, objection: "I'll just use my credit card for emergencies.", category: "Product Value", difficulty: 2, response: "That's a plan — but at 22% interest on a credit card vs. pennies a day for coverage, the math doesn't work in your favor. Plus, a credit card doesn't prevent the problem, it just changes how you pay for it — at a much higher rate.", underlyingConcern: "Has a fallback plan but hasn't done cost comparison." },
  { id: 9, objection: "What does GAP even cover? I don't understand it.", category: "Product Value", difficulty: 1, response: "Great question. If your vehicle is totaled or stolen, insurance pays market value — not what you owe. GAP covers that difference. On a $40,000 vehicle, that gap could be $8,000 or more in the first two years. Without it, you'd write that check out of pocket.", underlyingConcern: "Genuine lack of product knowledge; needs education, not persuasion." },
  { id: 10, objection: "These products are just profit for the dealership.", category: "Product Value", difficulty: 5, response: "I understand the skepticism. The truth is, we make a modest amount on these, yes — but we also see the claims data. Last month alone, our customers filed over $180,000 in warranty claims. Those are real repairs on real cars that would have come out of their pockets. My job is to make sure you're protected.", underlyingConcern: "Trust issue masked as value objection; needs transparency and social proof." },

  // Trust/Dealership (4)
  { id: 11, objection: "I don't trust dealership add-ons.", category: "Trust/Dealership", difficulty: 4, response: "I respect that honesty. These aren't dealership add-ons — they're programs backed by A-rated insurance companies. The claims process goes directly through the administrator, not us. Would you like to see the claims history and customer reviews?", underlyingConcern: "Prior negative experience with dealerships; needs third-party validation." },
  { id: 12, objection: "My buddy told me never to buy anything in the finance office.", category: "Trust/Dealership", difficulty: 3, response: "I appreciate that your friend is looking out for you. But let me ask — does your friend also know the average cost of a transmission on this vehicle? The advice to 'never buy' is based on old information. Today's vehicles are more complex and more expensive to repair than ever.", underlyingConcern: "Social influence from uninformed source; needs to be redirected to data." },
  { id: 13, objection: "I've read online that these are all scams.", category: "Trust/Dealership", difficulty: 5, response: "I've read those articles too — and some providers in the past deserved that reputation. That's why we only work with top-rated administrators. Here's the contract — everything is in writing. I'd rather you make an informed decision based on what's actually covered than on a headline.", underlyingConcern: "Online research created bias; needs specifics to counter generalizations." },
  { id: 14, objection: "Can I get this cheaper somewhere else?", category: "Trust/Dealership", difficulty: 3, response: "You can shop aftermarket providers, absolutely. But here's what you'll find: higher prices for less coverage, no loaner car, and a claims process that takes weeks. Our programs are negotiated at volume pricing, backed by the manufacturer's network, and we handle the claim right here.", underlyingConcern: "Comparison shopping instinct; needs competitive positioning." },

  // I Already Have It (4)
  { id: 15, objection: "I already have AAA, I don't need roadside.", category: "I Already Have It", difficulty: 1, response: "AAA is great for a tow. But our roadside also includes rental coverage, trip interruption reimbursement, and lockout service — and it's already built into this package at no extra cost. Think of it as AAA plus.", underlyingConcern: "Doesn't understand product differentiation; sees overlap that doesn't exist." },
  { id: 16, objection: "My insurance covers everything.", category: "I Already Have It", difficulty: 3, response: "Your insurance covers accidents and liability — but not mechanical breakdowns. If your transmission fails on the highway, insurance won't pay a dime for the repair. That's what the service contract covers — the things insurance doesn't.", underlyingConcern: "Confusing insurance types; needs clear delineation of coverage boundaries." },
  { id: 17, objection: "I have an emergency fund set aside.", category: "I Already Have It", difficulty: 3, response: "That's smart financial planning. But wouldn't you rather keep that emergency fund for a real emergency — medical, job loss, family — and let a $2/day product handle car repairs? Self-insuring a depreciating asset ties up capital you might need elsewhere.", underlyingConcern: "Financially disciplined; respond with sophisticated financial reasoning." },
  { id: 18, objection: "The manufacturer warranty covers everything.", category: "I Already Have It", difficulty: 2, response: "It does — for now. Your bumper-to-bumper runs 3 years or 36,000 miles, whichever comes first. Most people keep their cars 6-7 years. That's 3-4 years of exposure. The extended service contract picks up right where the factory warranty drops off.", underlyingConcern: "Misunderstanding warranty duration; needs timeline education." },

  // Timing/Urgency (4)
  { id: 19, objection: "Let me think about it and come back later.", category: "Timing/Urgency", difficulty: 4, response: "Absolutely, take your time. I just want you to know — today's rate is locked to this transaction. If you come back next week, the rate may be different and some programs may no longer be available for your vehicle at this mileage. Want me to print a summary so you can review at home?", underlyingConcern: "Decision fatigue; needs time but also needs urgency context." },
  { id: 20, objection: "I'll add it when I come in for my first service.", category: "Timing/Urgency", difficulty: 3, response: "I wish it worked that way, but these products are only available at the time of purchase at these rates. Once you drive off the lot, coverage costs increase significantly and some products — like GAP — can't be added at all. This is your best opportunity.", underlyingConcern: "Procrastination; doesn't realize the purchase window is limited." },
  { id: 21, objection: "We've been here for hours, just let us go.", category: "Timing/Urgency", difficulty: 4, response: "I completely understand — and I want to respect your time. Let me take 90 seconds to show you the three most important protections. If none of them make sense, we'll wrap up immediately. Fair enough?", underlyingConcern: "Fatigue and frustration; needs empathy and efficiency, not more selling." },
  { id: 22, objection: "I just want to get this over with.", category: "Timing/Urgency", difficulty: 3, response: "I get it — car buying is a long process. Here's my commitment: I'll show you a simple menu, you tell me what matters to you, and we'll be done in under 5 minutes. The last thing I want is for you to call me in 6 months wishing we'd had this conversation.", underlyingConcern: "Process fatigue; needs streamlined presentation with emotional close." },

  // Credit/Approval (3)
  { id: 23, objection: "My credit isn't great, will these products affect my approval?", category: "Credit/Approval", difficulty: 2, response: "Great question — the products are added after your approval, so they don't affect your credit decision at all. In fact, lenders like to see protection products because it means you're protecting the collateral. It can actually strengthen your file.", underlyingConcern: "Credit anxiety; fear that adding products could jeopardize the deal." },
  { id: 24, objection: "I'm already stretched on the approval, I can't add anything.", category: "Credit/Approval", difficulty: 4, response: "I understand your situation. That's actually why GAP coverage is even more important for you. With a higher rate and longer term, you'll be upside down on this vehicle for years. If something happens, you could owe $10,000+ more than insurance pays. GAP is your safety net.", underlyingConcern: "Financial vulnerability makes protection more — not less — important." },
  { id: 25, objection: "Can I finance the warranty separately?", category: "Credit/Approval", difficulty: 1, response: "We can roll it right into your existing financing so it's one simple payment. Financing it separately would actually cost you more because you'd lose the competitive rate you already have. Let me show you the monthly impact — it's usually less than people expect.", underlyingConcern: "Wants to manage cash flow; needs to see monthly payment delta." },
];

const STORAGE_KEY = "fi-copilot-objection-practiced";

function getPracticedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function savePracticedSet(set: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

export default function ObjectionLibrary() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [practiced, setPracticed] = useState<Set<number>>(getPracticedSet);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceTimerStart, setPracticeTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!practiceTimerStart) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - practiceTimerStart) / 1000)), 200);
    return () => clearInterval(iv);
  }, [practiceTimerStart]);

  const togglePracticed = (id: number) => {
    setPracticed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      savePracticedSet(next);
      return next;
    });
  };

  const filtered = useMemo(() =>
    OBJECTIONS.filter((o) => {
      if (category !== "All" && o.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return o.objection.toLowerCase().includes(q) || o.response.toLowerCase().includes(q) || o.category.toLowerCase().includes(q);
      }
      return true;
    }),
    [search, category]
  );

  // Objection of the day: index by day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const objectionOfDay = OBJECTIONS[dayOfYear % OBJECTIONS.length];

  const practicedCount = practiced.size;
  const progressPct = Math.round((practicedCount / OBJECTIONS.length) * 100);

  const startPractice = () => {
    setPracticeMode(true);
    setPracticeTimerStart(Date.now());
    setElapsed(0);
  };

  const stopPractice = () => {
    setPracticeMode(false);
    setPracticeTimerStart(null);
    setElapsed(0);
  };

  return (
    <AppLayout title="Objection Library" subtitle="ASURA-proven responses to every F&I objection">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Progress + Practice Mode */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">{practicedCount}/{OBJECTIONS.length} practiced this week</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{progressPct}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {practiceMode ? (
              <>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1">
                  <Timer className="w-3 h-3" />
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </Badge>
                <button onClick={stopPractice} className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                  Stop Practice
                </button>
              </>
            ) : (
              <button onClick={startPractice} className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Practice Mode
              </button>
            )}
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Objection of the Day */}
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">Objection of the Day</span>
            <Badge variant="outline" className="text-[10px]">{objectionOfDay.category}</Badge>
          </div>
          <p className="text-sm font-medium text-foreground italic mb-2">"{objectionOfDay.objection}"</p>
          {!practiceMode && (
            <p className="text-xs text-muted-foreground">{objectionOfDay.response}</p>
          )}
        </Card>

        {/* Search + Category Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search objections by keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Objection Cards */}
        <div className="space-y-3">
          {filtered.map((obj) => {
            const isExpanded = expandedId === obj.id;
            const isPracticed = practiced.has(obj.id);
            return (
              <Card key={obj.id} className={`overflow-hidden transition-all ${isPracticed ? "border-green-500/20" : ""}`}>
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5 shrink-0"
                      onClick={(e) => { e.stopPropagation(); togglePracticed(obj.id); }}
                    >
                      {isPracticed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">"{obj.objection}"</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{obj.category}</Badge>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < obj.difficulty ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        {isPracticed && (
                          <span className="text-[10px] text-green-400 font-medium">Practiced</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border">
                    <div className="mt-3 space-y-3">
                      {practiceMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400">Practice Mode — response hidden</span>
                          </div>
                          <textarea
                            placeholder="Type your response here, then reveal the ASURA answer..."
                            className="w-full h-24 p-3 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => setPracticeMode(false)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Reveal ASURA Response
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">ASURA Response</p>
                            <p className="text-xs text-foreground leading-relaxed">{obj.response}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Underlying Concern</p>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">{obj.underlyingConcern}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No objections match your search.</p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
