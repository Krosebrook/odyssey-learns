import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ParentSetup from "./pages/ParentSetup";
import ChildDashboard from "./pages/ChildDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import Rewards from "./pages/Rewards";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import Settings from "./pages/Settings";
import Badges from "./pages/Badges";
import Social from "./pages/Social";
import BetaAnalytics from "./pages/BetaAnalytics";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import BetaProgram from "./pages/BetaProgram";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Discord from "./pages/Discord";
import Support from "./pages/Support";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/parent-setup" element={<ParentSetup />} />
            <Route path="/dashboard" element={<ChildDashboard />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lesson/:id" element={<LessonDetail />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/social" element={<Social />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/beta-analytics" element={<BetaAnalytics />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/beta-program" element={<BetaProgram />} />
            <Route path="/beta-feedback" element={<BetaAnalytics />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/discord" element={<Discord />} />
            <Route path="/support" element={<Support />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
