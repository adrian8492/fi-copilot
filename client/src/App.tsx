import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LiveSession from "./pages/LiveSession";
import SessionDetail from "./pages/SessionDetail";
import SessionHistory from "./pages/SessionHistory";
import Analytics from "./pages/Analytics";
import BatchUpload from "./pages/BatchUpload";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/session/new" component={LiveSession} />
      <Route path="/session/:id" component={SessionDetail} />
      <Route path="/history" component={SessionHistory} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/upload" component={BatchUpload} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
