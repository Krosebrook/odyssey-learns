import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Award, TrendingUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Lessons", path: "/lessons" },
  { icon: Award, label: "Badges", path: "/badges" },
  { icon: TrendingUp, label: "Rewards", path: "/rewards" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-16 w-full border-b bg-background px-4">
      <div className="container mx-auto">
        <ul className="flex items-center justify-around md:justify-start md:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 rounded-lg smooth-transition relative",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs md:text-sm">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
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
