import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Mic, Users, X, Clock, Command, ChevronRight } from "lucide-react";
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
      // Focus input on next tick so the element is mounted
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Build a flat list of navigable items for keyboard nav
  const sessionResults = results ?? [];
  const navigableItems = sessionResults.map((s) => ({
    id: s.id,
    label: s.customerName || `Session #${s.id}`,
    subtitle: [s.dealNumber, s.dealType, s.status].filter(Boolean).join(" · "),
    path: `/session/${s.id}`,
  }));

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
          prev < navigableItems.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : navigableItems.length - 1
        );
        return;
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const item = navigableItems[highlightedIndex];
        if (item) {
          handleNavigate(item.path);
        }
      }
    },
    [navigableItems, highlightedIndex, handleNavigate, onClose]
  );

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  if (!open) return null;

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
            placeholder="Search sessions, customers..."
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
          {/* Recent searches (shown when no query) */}
          {query.length < 2 && recentSearches.length > 0 && (
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
            </div>
          )}

          {/* Empty state when no query */}
          {query.length < 2 && recentSearches.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Type to search sessions and customers</p>
              <p className="text-xs mt-1 opacity-60">
                Minimum 2 characters
              </p>
            </div>
          )}

          {/* Loading state */}
          {query.length >= 2 && isFetching && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          )}

          {/* Session results */}
          {query.length >= 2 && !isFetching && navigableItems.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-3 h-3" />
                Sessions
              </div>
              {navigableItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors",
                    highlightedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
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
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isFetching && navigableItems.length === 0 && (
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
