import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Search, Star } from "lucide-react";

type Category = "Opening" | "Menu Presentation" | "Objection Responses" | "Closing" | "Turnover" | "Compliance Disclosures";
type Pillar = "Menu Order System" | "Upgrade Architecture" | "Objection Prevention Framework" | "Coaching Cadence";

interface WordTrack {
  id: number;
  title: string;
  category: Category;
  situation: string;
  script: string;
  pillar: Pillar;
  rating: number;
}

const STORAGE_KEY = "fi-word-track-favorites";

const TRACKS: WordTrack[] = [
  { id: 1, title: "Strong First 30 Seconds", category: "Opening", situation: "Set control early after handoff.", script: "Before we touch paperwork, I want to show you how we protect the investment and keep the payment clean. This takes three minutes, then we decide what fits you.", pillar: "Menu Order System", rating: 5 },
  { id: 2, title: "Time Buyer Reset", category: "Opening", situation: "Customer says they are in a rush.", script: "Perfect. The fastest way through this is doing it in the right order once, instead of circling back after signatures.", pillar: "Menu Order System", rating: 4 },
  { id: 3, title: "Expectation Frame", category: "Opening", situation: "Customer is guarded before menu presentation.", script: "My job is simple. Show you every option, explain what it does in plain English, and let you decide what makes sense.", pillar: "Objection Prevention Framework", rating: 5 },
  { id: 4, title: "Menu Transparency Setup", category: "Menu Presentation", situation: "Introduce all options without pressure.", script: "Everything is on one menu so nothing gets skipped, hidden, or added later. We review top to bottom and build what protects you best.", pillar: "Menu Order System", rating: 5 },
  { id: 5, title: "Payment Ladder", category: "Menu Presentation", situation: "Move customer from good to better coverage.", script: "If you were comfortable here, for another few dollars you protect the electronics, tires, and lease-end surprises too. That is where most customers land.", pillar: "Upgrade Architecture", rating: 5 },
  { id: 6, title: "Ownership Cost Frame", category: "Menu Presentation", situation: "Customer focuses only on upfront price.", script: "I get it. I look at ownership cost, not just purchase cost. One repair can cost more than the protection plan.", pillar: "Upgrade Architecture", rating: 4 },
  { id: 7, title: "Menu Pause", category: "Menu Presentation", situation: "Slow down and let choices land.", script: "Take a look at the middle option first. That tends to fit the way most people actually use the vehicle.", pillar: "Upgrade Architecture", rating: 4 },
  { id: 8, title: "I Need To Think About It", category: "Objection Responses", situation: "Customer stalls after menu.", script: "Usually when someone says that, they are deciding between doing nothing and doing the option that actually solves the problem. Which one are you weighing?", pillar: "Objection Prevention Framework", rating: 5 },
  { id: 9, title: "I Never Keep Cars Long", category: "Objection Responses", situation: "Customer resists VSC or maintenance.", script: "That is exactly why short-term ownership protection matters. The next 24 to 36 months is when the value hit hurts most if something happens.", pillar: "Objection Prevention Framework", rating: 4 },
  { id: 10, title: "Cash Buyer GAP Pivot", category: "Objection Responses", situation: "Cash buyer dismisses protection.", script: "Since you own it free and clear, protecting your equity matters even more. One total loss turns your cash position into a depreciation problem.", pillar: "Upgrade Architecture", rating: 4 },
  { id: 11, title: "Monthly Payment Compression", category: "Objection Responses", situation: "Customer says payment is too high.", script: "The difference between protected and unprotected here is less than what most people spend on coffee in a week. The repair risk is not.", pillar: "Upgrade Architecture", rating: 5 },
  { id: 12, title: "Shop Anywhere Rebuttal", category: "Objection Responses", situation: "Customer says they have their own mechanic.", script: "That is fine. This is not about where you service it, it is about who writes the check when something expensive breaks.", pillar: "Objection Prevention Framework", rating: 4 },
  { id: 13, title: "Spouse Needs To Decide", category: "Objection Responses", situation: "Absent decision maker objection.", script: "Totally fair. Let’s at least narrow it to the one option you would feel bad not showing them, so the conversation at home is simpler.", pillar: "Objection Prevention Framework", rating: 5 },
  { id: 14, title: "Close On Risk", category: "Closing", situation: "Customer is down to final choice.", script: "If nothing goes wrong, any option works. If something does go wrong, which setup would you wish you chose today?", pillar: "Upgrade Architecture", rating: 5 },
  { id: 15, title: "Assumptive Wrap", category: "Closing", situation: "Move to signatures confidently.", script: "Perfect. We will lock in the preferred coverage and keep your paperwork moving.", pillar: "Menu Order System", rating: 4 },
  { id: 16, title: "Value Confirmation", category: "Closing", situation: "Confirm customer commitment before signing.", script: "Just so we are aligned, this is the option that protects the payment, the equity, and the repair exposure the best.", pillar: "Upgrade Architecture", rating: 4 },
  { id: 17, title: "Sales To F&I Handoff", category: "Turnover", situation: "Desk or sales handoff.", script: "I have Adrian coming in now. He will finalize the protection and lender side so you can leave fully buttoned up.", pillar: "Coaching Cadence", rating: 4 },
  { id: 18, title: "Turnover Recovery", category: "Turnover", situation: "Weak handoff, customer defensive.", script: "Looks like they handled the vehicle side. I handle the money, lender, and protection side so nothing gets missed at the finish line.", pillar: "Menu Order System", rating: 4 },
  { id: 19, title: "Manager Intro", category: "Turnover", situation: "Introduce leadership presence.", script: "My manager will pop in for 30 seconds too, just to make sure we kept this clean and efficient for you.", pillar: "Coaching Cadence", rating: 3 },
  { id: 20, title: "Rate Markup Disclosure", category: "Compliance Disclosures", situation: "Explain lender rate difference.", script: "The lender approved the transaction and this is the contract rate available today. I also need to disclose that dealer participation may be included in the rate where allowed by law.", pillar: "Objection Prevention Framework", rating: 5 },
  { id: 21, title: "Product Optionality", category: "Compliance Disclosures", situation: "Avoid tying products to approval.", script: "These protections are optional. Your approval is not dependent on buying any of them.", pillar: "Objection Prevention Framework", rating: 5 },
  { id: 22, title: "Privacy Notice Walkthrough", category: "Compliance Disclosures", situation: "Privacy disclosure.", script: "This notice explains how your information is used and shared in the normal course of the transaction. I want to make sure you know exactly what it covers.", pillar: "Coaching Cadence", rating: 4 },
  { id: 23, title: "Adverse Action Explanation", category: "Compliance Disclosures", situation: "When terms change or customer not approved as requested.", script: "Because the structure changed from the original request, I need to provide this notice explaining the credit decision and your rights.", pillar: "Coaching Cadence", rating: 4 },
  { id: 24, title: "Service Contract Anchor", category: "Menu Presentation", situation: "Present VSC with confidence.", script: "On today’s vehicles, one screen or module can wipe out the savings of skipping coverage. This keeps that from becoming your problem.", pillar: "Upgrade Architecture", rating: 5 },
  { id: 25, title: "GAP Close", category: "Closing", situation: "Close GAP specifically.", script: "You are financing a depreciating asset. GAP protects the difference between what you owe and what insurance may not cover. That is not a fun gap to own yourself.", pillar: "Upgrade Architecture", rating: 5 },
  { id: 26, title: "Menu Reframe After No", category: "Objection Responses", situation: "Customer says no to everything immediately.", script: "No problem. Let’s isolate the one area that would hurt most if it went wrong, then we can ignore the rest.", pillar: "Objection Prevention Framework", rating: 5 },
];

const CATEGORIES: Category[] = ["Opening", "Menu Presentation", "Objection Responses", "Closing", "Turnover", "Compliance Disclosures"];

export default function WordTracks() {
  useEffect(() => {
    document.title = "Word Track Library | F&I Co-Pilot by ASURA Group";
  }, []);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const filtered = useMemo(() => {
    return TRACKS.filter((track) => {
      const matchesTab = tab === "all" || favorites.includes(track.id);
      const matchesCategory = category === "All" || track.category === category;
      const q = search.toLowerCase();
      const matchesSearch = !q || [track.title, track.situation, track.script].some((value) => value.toLowerCase().includes(q));
      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [category, favorites, search, tab]);

  const counts = useMemo(() => {
    return CATEGORIES.reduce((acc, current) => {
      acc[current] = TRACKS.filter((track) => track.category === current).length;
      return acc;
    }, {} as Record<Category, number>);
  }, []);

  function toggleFavorite(id: number) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleOpen(id: number) {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function copyTrack(track: WordTrack) {
    const payload = `${track.title}\nSituation: ${track.situation}\n\n${track.script}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      console.log(payload);
    }
  }

  return (
    <AppLayout title="Word Track Library" subtitle="Proven F&I scripts, rebuttals, and compliance language">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 p-4 lg:p-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search word tracks" className="pl-9" />
              </div>
              <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | "favorites") }>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2">
                <Button variant={category === "All" ? "default" : "outline"} className="w-full justify-between" onClick={() => setCategory("All")}>All Categories <Badge variant="secondary">{TRACKS.length}</Badge></Button>
                {CATEGORIES.map((item) => (
                  <Button key={item} variant={category === item ? "default" : "outline"} className="w-full justify-between" onClick={() => setCategory(item)}>
                    <span className="truncate">{item}</span>
                    <Badge variant="secondary">{counts[item]}</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Tracks</div><div className="text-2xl font-bold">{filtered.length}</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Favorites</div><div className="text-2xl font-bold">{favorites.length}</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Categories</div><div className="text-2xl font-bold">{CATEGORIES.length}</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Avg Rating</div><div className="text-2xl font-bold">{(TRACKS.reduce((sum, track) => sum + track.rating, 0) / TRACKS.length).toFixed(1)}</div></CardContent></Card>
          </div>

          <div className="space-y-3">
            {filtered.map((track) => {
              const expanded = openIds.includes(track.id);
              const favored = favorites.includes(track.id);
              return (
                <Card key={track.id}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{track.title}</h3>
                          <Badge variant="outline">{track.category}</Badge>
                          <Badge className="bg-primary/10 text-primary">{track.pillar}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{track.situation}</p>
                        <div className="text-amber-400 text-sm">{"★".repeat(track.rating)}{"☆".repeat(5 - track.rating)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant={favored ? "default" : "outline"} size="sm" onClick={() => toggleFavorite(track.id)}>
                          <Star className="w-4 h-4 mr-1" /> {favored ? "Favorited" : "Favorite"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyTrack(track)}>
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                      </div>
                    </div>
                    <Collapsible open={expanded} onOpenChange={() => toggleOpen(track.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="px-0">
                          <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
                          {expanded ? "Hide script" : "Show script"}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="rounded-lg bg-muted/50 border p-4 text-sm leading-6">
                          {track.script}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
