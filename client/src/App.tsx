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
const MfaVerify = lazy(() => import("./pages/MfaVerify"));
const MfaSetup = lazy(() => import("./pages/MfaSetup"));

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
        <Route path="/mfa/verify" component={MfaVerify} />
        <Route path="/mfa/setup" component={MfaSetup} />
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
