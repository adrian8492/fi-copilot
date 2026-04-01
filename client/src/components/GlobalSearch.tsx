import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search,
  Mic,
  Users,
  X,
  Clock,
  Command,
  ChevronRight,
  BarChart3,
  Shield,
  Trophy,
  Download,
  Calendar,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "fi-copilot-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const recent = getRecentSearches().filter((s) => s !== trimmed);
  recent.unshift(trimmed);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

// ── Quick Actions ──────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Start New Session", icon: Mic, path: "/session/new", shortcut: "N" },
  { label: "View Analytics", icon: BarChart3, path: "/analytics", shortcut: "A" },
  { label: "Check Compliance", icon: Shield, path: "/compliance-audit", shortcut: "C" },
  { label: "Open Leaderboard", icon: Trophy, path: "/leaderboard", shortcut: "L" },
  { label: "Export Report", icon: Download, path: "/coaching-report", shortcut: "E" },
  { label: "Schedule 1-on-1", icon: Calendar, path: "/one-on-ones", shortcut: "S" },
];

// ── Page index for fuzzy matching ──────────────────────────
const PAGE_INDEX = [
  { name: "Dashboard", path: "/", category: "Pages" as const },
  { name: "Live Session", path: "/session/new", category: "Pages" as const },
  { name: "Session History", path: "/history", category: "Pages" as const },
  { name: "Analytics", path: "/analytics", category: "Pages" as const },
  { name: "Customers", path: "/customers", category: "Pages" as const },
  { name: "Product Menu", path: "/product-menu", category: "Pages" as const },
  { name: "Batch Upload", path: "/upload", category: "Pages" as const },
  { name: "Notifications", path: "/notifications", category: "Pages" as const },
  { name: "Eagle Eye View", path: "/eagle-eye", category: "Pages" as const },
  { name: "Scorecard", path: "/scorecard", category: "Pages" as const },
  { name: "Objection Analysis", path: "/objections", category: "Pages" as const },
  { name: "Demo Mode", path: "/demo", category: "Pages" as const },
  { name: "Deal Recovery", path: "/deal-recovery", category: "Pages" as const },
  { name: "Compare Sessions", path: "/compare", category: "Pages" as const },
  { name: "Leaderboard", path: "/leaderboard", category: "Pages" as const },
  { name: "Goal Tracker", path: "/goals", category: "Pages" as const },
  { name: "Deal Scoring", path: "/deal-scoring", category: "Pages" as const },
  { name: "Coaching Report", path: "/coaching-report", category: "Pages" as const },
  { name: "Trainer Dashboard", path: "/trainer", category: "Pages" as const },
  { name: "Deal Timeline", path: "/deal-timeline", category: "Pages" as const },
  { name: "Multi-Location Rollup", path: "/multi-location", category: "Pages" as const },
  { name: "Shift Performance", path: "/shift-performance", category: "Pages" as const },
  { name: "Training Curriculum", path: "/training", category: "Pages" as const },
  { name: "Profit Analysis", path: "/profit-analysis", category: "Pages" as const },
  { name: "Customer Journey", path: "/customer-journey", category: "Pages" as const },
  { name: "1-on-1 Tracker", path: "/one-on-ones", category: "Pages" as const },
  { name: "Compliance Audit", path: "/compliance-audit", category: "Pages" as const },
  { name: "Compliance Rules", path: "/compliance-rules", category: "Pages" as const },
  { name: "Admin Panel", path: "/admin", category: "Pages" as const },
  { name: "Dealership Settings", path: "/settings", category: "Pages" as const },
  { name: "Pipeline Diagnostics", path: "/diagnostics", category: "Pages" as const },
];

// Demo manager data for search
const MANAGER_INDEX = [
  { name: "Marcus Rivera", path: "/scorecard?id=1", category: "Managers" as const },
  { name: "Jessica Chen", path: "/scorecard?id=2", category: "Managers" as const },
  { name: "David Park", path: "/scorecard?id=3", category: "Managers" as const },
  { name: "Sarah Kim", path: "/scorecard?id=4", category: "Managers" as const },
  { name: "Tony Morales", path: "/scorecard?id=5", category: "Managers" as const },
  { name: "Linda Tran", path: "/scorecard?id=6", category: "Managers" as const },
];

// Demo customer data for search
const CUSTOMER_INDEX = [
  { name: "John Williams", path: "/customers/1", category: "Customers" as const },
  { name: "Maria Garcia", path: "/customers/2", category: "Customers" as const },
  { name: "Robert Johnson", path: "/customers/3", category: "Customers" as const },
  { name: "Lisa Anderson", path: "/customers/4", category: "Customers" as const },
];

type SearchCategory = "Pages" | "Sessions" | "Managers" | "Customers";

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // Check if query words appear in text (each word is a substring match)
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((w) => lower.includes(w));
}

const CATEGORY_ICONS: Record<SearchCategory, React.ComponentType<{ className?: string }>> = {
  Pages: LayoutDashboard,
  Sessions: Mic,
  Managers: Users,
  Customers: FileText,
};

export default function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: results, isFetching } = trpc.sessions.search.useQuery(
    { query, limit: 8 },
    { enabled: open && query.length >= 2 }
  );

  // Load recent searches when modal opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setHighlightedIndex(-1);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Build categorized results
  const categorizedResults = useMemo(() => {
    if (query.length < 2) return [];

    const items: Array<{ id: string; label: string; subtitle?: string; path: string; category: SearchCategory }> = [];

    // Pages (fuzzy match)
    const matchedPages = PAGE_INDEX.filter((p) => fuzzyMatch(p.name, query));
    for (const p of matchedPages.slice(0, 5)) {
      items.push({ id: `page-${p.path}`, label: p.name, path: p.path, category: "Pages" });
    }

    // Sessions from API
    const sessionResults = results ?? [];
    for (const s of sessionResults) {
      items.push({
        id: `session-${s.id}`,
        label: s.customerName || `Session #${s.id}`,
        subtitle: [s.dealNumber, s.dealType, s.status].filter(Boolean).join(" · "),
        path: `/session/${s.id}`,
        category: "Sessions",
      });
    }

    // Managers (fuzzy match)
    const matchedManagers = MANAGER_INDEX.filter((m) => fuzzyMatch(m.name, query));
    for (const m of matchedManagers) {
      items.push({ id: `mgr-${m.path}`, label: m.name, path: m.path, category: "Managers" });
    }

    // Customers (fuzzy match)
    const matchedCustomers = CUSTOMER_INDEX.filter((c) => fuzzyMatch(c.name, query));
    for (const c of matchedCustomers) {
      items.push({ id: `cust-${c.path}`, label: c.name, path: c.path, category: "Customers" });
    }

    return items;
  }, [query, results]);

  // Group by category for rendering
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof categorizedResults> = {};
    for (const item of categorizedResults) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [categorizedResults]);

  const flatItems = categorizedResults;

  const handleNavigate = useCallback(
    (path: string) => {
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
      navigate(path);
      onClose();
    },
    [query, navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        return;
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const item = flatItems[highlightedIndex];
        if (item) {
          handleNavigate(item.path);
        }
      }
    },
    [flatItems, highlightedIndex, handleNavigate, onClose]
  );

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  if (!open) return null;

  const showQuickActions = query.length < 2 && recentSearches.length === 0;
  const showRecent = query.length < 2 && recentSearches.length > 0;
  const showResults = query.length >= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-xl mx-4 overflow-hidden shadow-2xl border-border bg-card">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sessions, customers, pages..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Quick Actions (when search empty and no recent) */}
          {showQuickActions && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </div>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigate(action.path)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  <action.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          )}

          {/* Recent searches (shown when no query but has recent) */}
          {showRecent && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((recent, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(recent)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{recent}</span>
                </button>
              ))}
              {/* Quick Actions below recent */}
              <div className="px-2 py-1.5 mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </div>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigate(action.path)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  <action.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {showResults && isFetching && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          )}

          {/* Categorized results */}
          {showResults && !isFetching && flatItems.length > 0 && (
            <div className="p-2">
              {(["Pages", "Sessions", "Managers", "Customers"] as SearchCategory[]).map((category) => {
                const items = groupedResults[category];
                if (!items || items.length === 0) return null;
                const CategoryIcon = CATEGORY_ICONS[category];
                return (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <CategoryIcon className="w-3 h-3" />
                      {category}
                    </div>
                    {items.map((item) => {
                      const globalIndex = flatItems.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.path)}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors",
                            highlightedIndex === globalIndex
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-accent/50"
                          )}
                        >
                          <div className="flex-1 text-left min-w-0">
                            <div className="truncate font-medium">{item.label}</div>
                            {item.subtitle && (
                              <div className="truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {showResults && !isFetching && flatItems.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results for "{query}"</p>
              <p className="text-xs mt-1 opacity-60">
                Try a different search term
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">↵</kbd>
              open
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">esc</kbd>
            close
          </span>
        </div>
      </Card>
    </div>
  );
}

/**
 * Hook for the parent component (e.g. AppLayout) to manage the Cmd+K shortcut.
 * Usage:
 *   const { open, setOpen, onClose } = useGlobalSearchShortcut();
 *   return <><GlobalSearch open={open} onClose={onClose} />...</>
 */
export function useGlobalSearchShortcut() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onClose = useCallback(() => setOpen(false), []);

  return { open, setOpen, onClose };
}
