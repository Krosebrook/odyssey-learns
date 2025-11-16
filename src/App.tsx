import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Eager-loaded pages (landing, auth, static) - Day 3 Performance Optimization
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Discord from "./pages/Discord";
import BetaProgram from "./pages/BetaProgram";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (heavy components) - Day 3 Performance Optimization
const ParentSetup = lazy(() => import("./pages/ParentSetup"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const ChildDashboard = lazy(() => import("./pages/ChildDashboard"));
const LessonPlayer = lazy(() => import("./pages/LessonPlayer"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CommunityLessons = lazy(() => import("./pages/CommunityLessons"));

// Lazy-loaded secondary pages - Day 3 Performance Optimization
const Lessons = lazy(() => import("./pages/Lessons"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const Badges = lazy(() => import("./pages/Badges"));
const Social = lazy(() => import("./pages/Social"));
const Settings = lazy(() => import("./pages/Settings"));
const Rewards = lazy(() => import("./pages/Rewards"));
const BetaAnalytics = lazy(() => import("./pages/BetaAnalytics"));
const BetaFeedbackAdmin = lazy(() => import("./pages/BetaFeedbackAdmin"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const LessonAnalytics = lazy(() => import("./pages/LessonAnalytics"));
const Phase1LessonGeneration = lazy(() => import("./pages/Phase1LessonGeneration"));
const SeedLessons = lazy(() => import("./pages/SeedLessons"));
const LessonReview = lazy(() => import("./pages/LessonReview"));
const LessonPerformanceAnalytics = lazy(() => import("./pages/LessonPerformanceAnalytics"));
const StudentPerformanceReport = lazy(() => import("./pages/StudentPerformanceReport"));
const SecurityMonitoring = lazy(() => import("./pages/SecurityMonitoring"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Eager-loaded routes (critical paths) */}
            <Route path="/" element={<Landing />} />
            <Route path="/index" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/beta-program" element={<BetaProgram />} />
            <Route path="/discord" element={<Discord />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Lazy-loaded routes (authenticated app pages) */}
            <Route
              path="/parent-setup"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ParentSetup />
                </Suspense>
              }
            />
            <Route
              path="/parent-dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ParentDashboard />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ChildDashboard />
                </Suspense>
              }
            />
            <Route
              path="/lessons"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Lessons />
                </Suspense>
              }
            />
            <Route
              path="/lessons/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LessonPlayer />
                </Suspense>
              }
            />
            <Route
              path="/lesson-detail/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LessonDetail />
                </Suspense>
              }
            />
            <Route
              path="/community-lessons"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityLessons />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              }
            />
            <Route
              path="/badges"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Badges />
                </Suspense>
              }
            />
            <Route
              path="/rewards"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Rewards />
                </Suspense>
              }
            />
            <Route
              path="/social"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Social />
                </Suspense>
              }
            />
            <Route
              path="/beta-analytics"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BetaAnalytics />
                </Suspense>
              }
            />
            <Route
              path="/beta-feedback"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BetaFeedbackAdmin />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="/admin-setup"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminSetup />
                </Suspense>
              }
            />
            <Route
              path="/lesson-review"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LessonReview />
                </Suspense>
              }
            />
            <Route
              path="/seed-lessons"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SeedLessons />
                </Suspense>
              }
            />
            <Route
              path="/security-monitoring"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SecurityMonitoring />
                </Suspense>
              }
            />
            <Route
              path="/phase1-lesson-generation"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Phase1LessonGeneration />
                </Suspense>
              }
            />
            <Route
              path="/system-health"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SystemHealth />
                </Suspense>
              }
            />
            <Route
              path="/lesson-analytics"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LessonAnalytics />
                </Suspense>
              }
            />
            <Route
              path="/lesson-performance"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LessonPerformanceAnalytics />
                </Suspense>
              }
            />
            <Route
              path="/student-performance"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StudentPerformanceReport />
                </Suspense>
              }
            />
            <Route
              path="/creator-dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CreatorDashboard />
                </Suspense>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
