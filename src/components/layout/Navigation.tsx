import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Award, TrendingUp, Users, Globe, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Lessons", path: "/lessons" },
  { icon: Globe, label: "Community", path: "/community-lessons" },
  { icon: Trophy, label: "Creator", path: "/creator-dashboard" },
  { icon: Award, label: "Badges", path: "/badges" },
  { icon: TrendingUp, label: "Rewards", path: "/rewards" },
  { icon: Users, label: "Social", path: "/social" },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav
      className="sticky top-16 w-full border-b bg-background px-4"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto">
        <ul className="flex items-center justify-around md:justify-start md:gap-8" role="menubar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} role="none">
                <Link
                  to={item.path}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 rounded-lg smooth-transition relative",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs md:text-sm">{item.label}</span>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
