import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LandingNavProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

/**
 * Landing page navigation with logo and auth buttons
 * Uses semantic design tokens for consistent styling
 */
export const LandingNav = ({ onSignIn, onGetStarted }: LandingNavProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      navigate("/login");
    }
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate("/login");
    }
  };

  return (
    <nav
      className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-primary-foreground">
                IO
              </span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Inner Odyssey
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                by Flashfusion
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button onClick={handleGetStarted} className="shadow-lg">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
