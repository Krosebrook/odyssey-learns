import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AuthRoutes } from "./routes/AuthRoutes";
import { PublicRoutes } from "./routes/PublicRoutes";
import { ParentRoutes } from "./routes/ParentRoutes";
import { ChildRoutes } from "./routes/ChildRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/pwa/PWAUpdatePrompt";

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App component
 * Orchestrates global providers and routing
 * Uses feature-based route organization for maintainability
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <Routes>
              {/* Authentication routes */}
              <Route path="/login" element={<AuthRoutes />} />
              <Route path="/reset-password" element={<AuthRoutes />} />
              <Route path="/update-password" element={<AuthRoutes />} />

              {/* Parent routes */}
              <Route path="/parent" element={<ParentRoutes />} />
              <Route path="/parent-setup" element={<ParentRoutes />} />

              {/* Child routes */}
              <Route path="/dashboard" element={<ChildRoutes />} />
              <Route path="/lessons/*" element={<ChildRoutes />} />
              <Route path="/creator" element={<ChildRoutes />} />
              <Route path="/community-lessons" element={<ChildRoutes />} />
              <Route path="/badges" element={<ChildRoutes />} />
              <Route path="/social" element={<ChildRoutes />} />
              <Route path="/settings" element={<ChildRoutes />} />
              <Route path="/rewards" element={<ChildRoutes />} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminRoutes />} />
              <Route path="/admin-setup" element={<AdminRoutes />} />
              <Route path="/beta-analytics" element={<AdminRoutes />} />
              <Route path="/beta-feedback-admin" element={<AdminRoutes />} />
              <Route path="/lesson-analytics" element={<AdminRoutes />} />
              <Route path="/phase1-lesson-generation" element={<AdminRoutes />} />
              <Route path="/seed-lessons" element={<AdminRoutes />} />
              <Route path="/lesson-review" element={<AdminRoutes />} />
              <Route path="/lesson-performance-analytics" element={<AdminRoutes />} />
              <Route path="/student-performance-report" element={<AdminRoutes />} />
              <Route path="/security-monitoring" element={<AdminRoutes />} />
              <Route path="/system-health" element={<AdminRoutes />} />

              {/* Public and error routes (fallback) */}
              <Route path="*" element={<PublicRoutes />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
