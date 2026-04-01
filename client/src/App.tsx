// Bundle analysis (2026-03-25): 5 chunks exceed 500KB (gzipped sizes in parens):
//   SessionDetail: 1,001 kB (292 kB) — largest; candidate for splitting sub-tabs into lazy chunks
//   emacs-lisp (shiki grammar): 780 kB (197 kB) — code highlighting grammar, unavoidable
//   cpp (shiki grammar): 626 kB (45 kB) — code highlighting grammar
//   wasm: 622 kB (231 kB) — shiki WASM runtime
//   index (vendor): 555 kB (165 kB) — core vendor bundle (React, tRPC, UI libs)
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Eager-load the dashboard (landing page) for instant first paint
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

// Lazy-load all other pages — each becomes its own chunk
const LiveSession = lazy(() => import("./pages/LiveSession"));
const SessionDetail = lazy(() => import("./pages/SessionDetail"));
const SessionHistory = lazy(() => import("./pages/SessionHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const BatchUpload = lazy(() => import("./pages/BatchUpload"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const EagleEyeView = lazy(() => import("./pages/EagleEyeView"));
const ObjectionAnalysis = lazy(() => import("./pages/ObjectionAnalysis"));
const DemoMode = lazy(() => import("./pages/DemoMode"));
const ComplianceRules = lazy(() => import("./pages/ComplianceRules"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const ManagerScorecard = lazy(() => import("./pages/ManagerScorecard"));
const SessionComparison = lazy(() => import("./components/SessionComparison"));
const PipelineDiagnostics = lazy(() => import("./pages/PipelineDiagnostics"));
const DealershipSettings = lazy(() => import("./pages/DealershipSettings"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const ProductMenu = lazy(() => import("./pages/ProductMenu"));
const DealRecovery = lazy(() => import("./pages/DealRecovery"));
const SessionPrintReport = lazy(() => import("./pages/SessionPrintReport"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const GoalTracker = lazy(() => import("./pages/GoalTracker"));
const DealScoring = lazy(() => import("./pages/DealScoring"));
const CoachingReportBuilder = lazy(() => import("./pages/CoachingReportBuilder"));
const TrainerDashboard = lazy(() => import("./pages/TrainerDashboard"));
const DealTimeline = lazy(() => import("./pages/DealTimeline"));
const MultiLocationRollup = lazy(() => import("./pages/MultiLocationRollup"));
const ShiftPerformance = lazy(() => import("./pages/ShiftPerformance"));
const TrainingCurriculum = lazy(() => import("./pages/TrainingCurriculum"));
const ProfitAnalysis = lazy(() => import("./pages/ProfitAnalysis"));
const CustomerJourney = lazy(() => import("./pages/CustomerJourney"));
const OneOnOneTracker = lazy(() => import("./pages/OneOnOneTracker"));
const ComplianceAudit = lazy(() => import("./pages/ComplianceAudit"));

// Minimal loading spinner for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/session/new" component={LiveSession} />
        <Route path="/session/:id/print" component={SessionPrintReport} />
        <Route path="/session/:id" component={SessionDetail} />
        <Route path="/history" component={SessionHistory} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/upload" component={BatchUpload} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/eagle-eye" component={EagleEyeView} />
        <Route path="/objections" component={ObjectionAnalysis} />
        <Route path="/demo" component={DemoMode} />
        <Route path="/scorecard" component={ManagerScorecard} />
        <Route path="/compliance-rules" component={ComplianceRules} />
        <Route path="/compare" component={SessionComparison} />
        <Route path="/join" component={JoinPage} />
        <Route path="/diagnostics" component={PipelineDiagnostics} />
        <Route path="/settings" component={DealershipSettings} />
        <Route path="/customers" component={Customers} />
        <Route path="/customers/:id" component={CustomerDetail} />
        <Route path="/product-menu" component={ProductMenu} />
        <Route path="/deal-recovery" component={DealRecovery} />
        <Route path="/notifications" component={NotificationCenter} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/goals" component={GoalTracker} />
        <Route path="/deal-scoring" component={DealScoring} />
        <Route path="/coaching-report" component={CoachingReportBuilder} />
        <Route path="/trainer" component={TrainerDashboard} />
        <Route path="/deal-timeline" component={DealTimeline} />
        <Route path="/multi-location" component={MultiLocationRollup} />
        <Route path="/shift-performance" component={ShiftPerformance} />
        <Route path="/training" component={TrainingCurriculum} />
        <Route path="/profit-analysis" component={ProfitAnalysis} />
        <Route path="/customer-journey" component={CustomerJourney} />
        <Route path="/one-on-ones" component={OneOnOneTracker} />
        <Route path="/compliance-audit" component={ComplianceAudit} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
