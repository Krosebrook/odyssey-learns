import { Link } from "react-router-dom";
import { Settings, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  childName?: string;
  points?: number;
  avatarConfig?: any;
  onSettingsClick?: () => void;
}

export const TopBar = ({ childName, points = 0, onSettingsClick }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">IO</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Inner Odyssey
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {childName && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">{points}</span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {childName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{childName}</span>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="hover-scale"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
