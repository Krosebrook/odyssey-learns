import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ParentSetup from "./pages/ParentSetup";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Settings from "./pages/Settings";
import Badges from "./pages/Badges";
import Rewards from "./pages/Rewards";
import Social from "./pages/Social";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import BetaProgram from "./pages/BetaProgram";
import Discord from "./pages/Discord";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import BetaAnalytics from "./pages/BetaAnalytics";
import BetaFeedbackAdmin from "./pages/BetaFeedbackAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import LessonReview from "./pages/LessonReview";
import CommunityLessons from "./pages/CommunityLessons";
import SeedLessons from "./pages/SeedLessons";
import AdminSetup from "./pages/AdminSetup";
import SecurityMonitoring from "./pages/SecurityMonitoring";
import Phase1LessonGeneration from "./pages/Phase1LessonGeneration";
import SystemHealth from "./pages/SystemHealth";
import LessonAnalytics from "./pages/LessonAnalytics";
import LessonPerformanceAnalytics from "./pages/LessonPerformanceAnalytics";
import CreatorDashboard from "./pages/CreatorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/index" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/parent-setup" element={<ParentSetup />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/dashboard" element={<ChildDashboard />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonPlayer />} />
            <Route path="/community-lessons" element={<CommunityLessons />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/social" element={<Social />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/beta-program" element={<BetaProgram />} />
            <Route path="/discord" element={<Discord />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/beta-analytics" element={<BetaAnalytics />} />
            <Route path="/beta-feedback" element={<BetaFeedbackAdmin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review/:reviewId" element={<LessonReview />} />
            <Route path="/lesson-analytics/:lessonId" element={<LessonAnalytics />} />
            <Route path="/creator-dashboard" element={<CreatorDashboard />} />
            <Route path="/security-monitoring" element={<SecurityMonitoring />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="/seed-lessons" element={<SeedLessons />} />
            <Route path="/phase1-lessons" element={<Phase1LessonGeneration />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
