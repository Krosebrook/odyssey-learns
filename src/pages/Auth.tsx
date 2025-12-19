import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Determine initial tab from URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    }
  }, [location.search]);

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/parent", { replace: true });
      }
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AuthLayout>
    );
  }

  // Don't render auth form if already logged in (will redirect)
  if (user) {
    return (
      <AuthLayout>
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader 
        showLogo 
        title="Welcome to Inner Odyssey" 
        description="Empowering kids to learn and grow"
      />

      <Card className="p-6 elevated-card">
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as "login" | "signup")} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm />
          </TabsContent>

          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => navigate("/admin-setup")}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Need to set up an admin? Click here
        </Button>
      </div>
    </AuthLayout>
  );
};

export default Auth;
