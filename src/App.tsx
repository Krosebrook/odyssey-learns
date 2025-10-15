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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
