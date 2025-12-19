import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/pwa/PWAUpdatePrompt";
import { SessionTimeoutProvider } from "./components/auth/SessionTimeoutProvider";

// Feature-based route renderers
import { 
  renderAuthRoutes, 
  renderPublicRoutes, 
  renderParentRoutes, 
  renderChildRoutes, 
  renderAdminRoutes 
} from "./routes";

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App Component
 * 
 * Route organization:
 * - AuthRoutes: Login, password reset, account recovery
 * - ParentRoutes: Parent dashboard, setup, child management
 * - ChildRoutes: Child dashboard, lessons, badges, rewards
 * - AdminRoutes: Admin dashboard, analytics, content management
 * - PublicRoutes: Landing, marketing pages, 404 fallback
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionTimeoutProvider>
              <Toaster />
              <Sonner />
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
              <Routes>
                {/* Auth routes: login, password reset */}
                {renderAuthRoutes()}
                
                {/* Parent routes: dashboard, setup, child management */}
                {renderParentRoutes()}
                
                {/* Child routes: dashboard, lessons, badges, rewards */}
                {renderChildRoutes()}
                
                {/* Admin routes: dashboard, analytics, content management */}
                {renderAdminRoutes()}
                
                {/* Public routes: landing, marketing, 404 fallback */}
                {renderPublicRoutes()}
              </Routes>
            </SessionTimeoutProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
