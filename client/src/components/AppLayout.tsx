import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Mic,
  History,
  BarChart3,
  Upload,
  ShieldCheck,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
  Menu,
  X,
  Eye,
  AlertTriangle,
  Play,
  ClipboardList,
  GitCompareArrows,
  Activity,
  KeyRound,
  Users,
  Package,
  DollarSign,
  Trophy,
  Bell,
  Target,
  Award,
  FileText,
  GraduationCap,
  Clock,
  Building2,
  Timer,
  BookOpen,
  TrendingUp,
  Map,
  UserCheck,
  ShieldAlert,
  MessageSquare,
  Calendar,
  Calculator,
  ReceiptText,
  ClipboardCheck,
  Sun,
  Moon,
  Grid3X3,
  FolderOpen,
  CalendarDays,
  Banknote,
  MoreHorizontal,
  Flame,
  ScrollText,
  ClipboardPenLine,
  LineChart,
  Camera,
  Car,
  Gift,
  FileSearch,
} from "lucide-react";
import { useState, useCallback, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import DealershipSwitcher from "@/components/DealershipSwitcher";
import { DelphiEmbed } from "@/components/DelphiEmbed";
import AlertBell from "@/components/AlertBell";
import { useRole } from "@/hooks/useRole";
import { useIsMobile } from "@/hooks/useMobile";
import GlobalSearch, { useGlobalSearchShortcut } from "@/components/GlobalSearch";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/session/new", label: "Live Session", icon: Mic, highlight: true },
  { path: "/history", label: "Session History", icon: History },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/product-menu", label: "Product Menu", icon: Package },
  { path: "/deal-jacket", label: "Deal Jacket", icon: FolderOpen },
  { path: "/upload", label: "Batch Upload", icon: Upload },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

const PERFORMANCE_ITEMS = [
  { path: "/eagle-eye", label: "Eagle Eye View", icon: Eye },
  { path: "/scorecard", label: "Scorecard", icon: ClipboardList },
  { path: "/objections", label: "Objection Analysis", icon: AlertTriangle },
  { path: "/demo", label: "Demo Mode", icon: Play },
  { path: "/deal-recovery", label: "Deal Recovery", icon: DollarSign },
  { path: "/compare", label: "Compare Sessions", icon: GitCompareArrows },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/goals", label: "Goal Tracker", icon: Target },
  { path: "/deal-scoring", label: "Deal Scoring", icon: Award },
  { path: "/coaching-report", label: "Coaching Report", icon: FileText },
  { path: "/deal-timeline", label: "Deal Timeline", icon: Clock },
  { path: "/shift-performance", label: "Shift Performance", icon: Timer },
  { path: "/customer-journey", label: "Customer Journey", icon: Map },
  { path: "/weekend-recap", label: "Weekend Recap", icon: CalendarDays },
  { path: "/benchmarks", label: "F&I Benchmarks", icon: BarChart3 },
  { path: "/heat-sheet", label: "Heat Sheet", icon: Flame },
  { path: "/fi-snapshot", label: "F&I Snapshot", icon: Camera },
  { path: "/coaching-planner", label: "Coaching Planner", icon: ClipboardPenLine },
  { path: "/fi-health", label: "F&I Health Score", icon: Activity },
];

const COACHING_ITEMS = [
  { path: "/trainer", label: "Trainer Dashboard", icon: GraduationCap },
  { path: "/training", label: "Training Curriculum", icon: BookOpen },
  { path: "/one-on-ones", label: "1-on-1 Tracker", icon: MessageSquare },
  { path: "/schedule", label: "Manager Schedule", icon: Calendar },
  { path: "/objection-library", label: "Objection Library", icon: BookOpen },
  { path: "/word-tracks", label: "Word Tracks", icon: ScrollText },
];

const OPERATIONS_ITEMS = [
  { path: "/multi-location", label: "Multi-Location Rollup", icon: Building2 },
  { path: "/profit-analysis", label: "Profit Analysis", icon: TrendingUp },
  { path: "/payoff-tracker", label: "Payoff Tracker", icon: ReceiptText },
  { path: "/lender-matrix", label: "Lender Matrix", icon: Grid3X3 },
  { path: "/stip-tracker", label: "Stip Tracker", icon: FileSearch },
  { path: "/funding-tracker", label: "Deal Funding Tracker", icon: ClipboardCheck },
  { path: "/desk-log", label: "Desk Log", icon: ClipboardPenLine },
  { path: "/rate-watch", label: "Rate Watch", icon: LineChart },
  { path: "/trade-in", label: "Trade-In Analyzer", icon: Car },
];

const BUSINESS_ITEMS = [
  { path: "/roi-calculator", label: "ROI Calculator", icon: Calculator },
  { path: "/commission-calculator", label: "Commission Calculator", icon: Banknote },
  { path: "/incentive-tracker", label: "Incentive Tracker", icon: Gift },
  { path: "/product-profit", label: "Product Profitability", icon: TrendingUp },
  { path: "/deal-profit", label: "Deal Profit Breakdown", icon: BarChart3 },
];

const ADMIN_ITEMS = [
  { path: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { path: "/compliance-rules", label: "Compliance Rules", icon: Shield },
  { path: "/compliance-audit", label: "Compliance Audit", icon: ShieldAlert },
  { path: "/compliance-scorecard", label: "Compliance Scorecard", icon: ClipboardCheck },
  { path: "/settings", label: "Dealership Settings", icon: Settings },
  { path: "/diagnostics", label: "Pipeline Diagnostics", icon: Activity },
  { path: "/mfa/setup", label: "MFA Security", icon: KeyRound },
];

// Extracted outside the component to avoid re-creation on every render
const NavItem = memo(function NavItem({
  item,
  isActive,
  onNavigate,
}: {
  item: { path: string; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean };
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link href={item.path}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
          isActive
            ? "bg-primary/15 text-primary border border-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          item.highlight && !isActive && "text-primary/80 hover:text-primary"
        )}
        onClick={onNavigate}
      >
        <item.icon className={cn("w-4 h-4 shrink-0", item.highlight && "text-primary")} />
        <span className="flex-1">{item.label}</span>
        {item.highlight && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
        {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
      </div>
    </Link>
  );
});

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { role, canAccess } = useRole();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const { open: searchOpen, setOpen: setSearchOpen, onClose: closeSearch } = useGlobalSearchShortcut();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading F&I Co-Pilot...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isItemActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground tracking-tight">F&I Co-Pilot</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Asura Group</p>
              </div>
            </div>
          </div>

          {/* Rooftop Switcher */}
          <DealershipSwitcher />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
            {NAV_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
              <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
            ))}

            <div className="pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Performance</p>
              {PERFORMANCE_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
              ))}
            </div>

            <div className="pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Coaching</p>
              {COACHING_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
              ))}
            </div>

            <div className="pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Operations</p>
              {OPERATIONS_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
              ))}
            </div>

            <div className="pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Business</p>
              {BUSINESS_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
              ))}
            </div>

            {role === "admin" && (
              <>
                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</p>
                  {ADMIN_ITEMS.map((item) => (
                    <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* Theme Toggle + User Profile */}
          <div className="px-3 py-4 border-t border-border space-y-2">
            <ThemeToggleButton />
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "User"}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-1 py-0 h-3.5",
                    role === "admin" ? "border-red-500/30 text-red-400" : role === "manager" ? "border-primary/30 text-primary/80" : "border-border text-muted-foreground"
                  )}>
                    {role === "admin" ? (user?.isSuperAdmin ? "Super Admin" : user?.isGroupAdmin ? "Group Admin" : "Admin") : role === "manager" ? "F&I Manager" : "Viewer"}
                  </Badge>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
          <aside className="relative w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-10">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="px-4 py-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground tracking-tight">F&I Co-Pilot</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Asura Group</p>
                  </div>
                </div>
              </div>

              {/* Rooftop Switcher */}
              <DealershipSwitcher />

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
                {NAV_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                  <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                ))}

                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Performance</p>
                  {PERFORMANCE_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                    <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Coaching</p>
                  {COACHING_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                    <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Operations</p>
                  {OPERATIONS_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                    <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Business</p>
                  {BUSINESS_ITEMS.filter((item) => canAccess(item.path)).map((item) => (
                    <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                  ))}
                </div>

                {role === "admin" && (
                  <>
                    <div className="pt-4">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</p>
                      {ADMIN_ITEMS.map((item) => (
                        <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} onNavigate={closeSidebar} />
                      ))}
                    </div>
                  </>
                )}
              </nav>

              {/* Theme Toggle + User Profile */}
              <div className="px-3 py-4 border-t border-border space-y-2">
                <ThemeToggleButton />
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "User"}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-1 py-0 h-3.5",
                        role === "admin" ? "border-red-500/30 text-red-400" : role === "manager" ? "border-primary/30 text-primary/80" : "border-border text-muted-foreground"
                      )}>
                        {role === "admin" ? (user?.isSuperAdmin ? "Super Admin" : user?.isGroupAdmin ? "Group Admin" : "Admin") : role === "manager" ? "F&I Manager" : "Viewer"}
                      </Badge>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Sign out</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 gap-4 shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-8 h-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {title && (
              <div>
                <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AlertBell />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-medium text-green-400">System Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-16 px-1" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {[
            { path: "/", label: "Dashboard", icon: LayoutDashboard },
            { path: "/session/new", label: "Live Session", icon: Mic },
            { path: "/history", label: "History", icon: History },
            { path: "/analytics", label: "Analytics", icon: BarChart3 },
          ].map((item) => {
            const active = isItemActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors min-w-[56px] relative",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => { closeSidebar(); setMoreDrawerOpen(false); }}
                >
                  <item.icon className={cn("w-5 h-5", active && "fill-primary/20")} />
                  <span className="text-[9px] font-medium leading-tight">{item.label}</span>
                  {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
                </button>
              </Link>
            );
          })}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors min-w-[56px] relative",
              moreDrawerOpen ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-tight">More</span>
            {moreDrawerOpen && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
          </button>
        </nav>

        {/* More Drawer (slide-up) */}
        {moreDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMoreDrawerOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-xl max-h-[70vh] overflow-y-auto"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2 mb-3" />
              {[
                { section: "Performance", items: PERFORMANCE_ITEMS },
                { section: "Coaching", items: COACHING_ITEMS },
                { section: "Operations", items: OPERATIONS_ITEMS },
                { section: "Business", items: BUSINESS_ITEMS },
                ...(role === "admin" ? [{ section: "Admin", items: ADMIN_ITEMS }] : []),
              ].map(group => (
                <div key={group.section} className="px-4 pb-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">{group.section}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.items.filter(item => canAccess(item.path)).map(item => {
                      const active = isItemActive(item.path);
                      return (
                        <Link key={item.path} href={item.path}>
                          <button
                            className={cn(
                              "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-center w-full transition-colors",
                              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                            )}
                            onClick={() => setMoreDrawerOpen(false)}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="px-4 pb-4">
                <ThemeToggleButton />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search (Cmd+K) */}
      <GlobalSearch open={searchOpen} onClose={closeSearch} />

      {/* Ask Adrian — Delphi AI floating button (authenticated users only) */}
      <DelphiEmbed />
    </div>
  );
}
