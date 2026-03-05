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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/session/new", label: "Live Session", icon: Mic, highlight: true },
  { path: "/history", label: "Session History", icon: History },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/upload", label: "Batch Upload", icon: Upload },
];

const PERFORMANCE_ITEMS = [
  { path: "/eagle-eye", label: "Eagle Eye View", icon: Eye },
  { path: "/scorecard", label: "Scorecard", icon: ClipboardList },
  { path: "/objections", label: "Objection Analysis", icon: AlertTriangle },
  { path: "/demo", label: "Demo Mode", icon: Play },
  { path: "/compare", label: "Compare Sessions", icon: GitCompareArrows },
];

const ADMIN_ITEMS = [
  { path: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { path: "/compliance-rules", label: "Compliance Rules", icon: Shield },
  { path: "/diagnostics", label: "Pipeline Diagnostics", icon: Activity },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const NavItem = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
    return (
      <Link href={item.path}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group",
            isActive
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            (item as { highlight?: boolean }).highlight && !isActive && "text-primary/80 hover:text-primary"
          )}
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className={cn("w-4 h-4 shrink-0", (item as { highlight?: boolean }).highlight && "text-primary")} />
          <span className="flex-1">{item.label}</span>
          {(item as { highlight?: boolean }).highlight && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
        {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} />)}

        <div className="pt-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Performance</p>
          {PERFORMANCE_ITEMS.map((item) => <NavItem key={item.path} item={item} />)}
        </div>

        {user?.role === "admin" && (
          <>
            <div className="pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</p>
              {ADMIN_ITEMS.map((item) => <NavItem key={item.path} item={item} />)}
            </div>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "User"}</p>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary/80">
                {user?.role === "admin" ? "Admin" : "F&I Manager"}
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
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-10">
            <SidebarContent />
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-medium text-green-400">System Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
