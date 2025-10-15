import { TopBar } from "./TopBar";
import { Navigation } from "./Navigation";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  childName?: string;
  points?: number;
}

export const AppLayout = ({ children, childName, points }: AppLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        childName={childName} 
        points={points}
        onSettingsClick={() => navigate('/settings')}
      />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
