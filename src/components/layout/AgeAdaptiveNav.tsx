import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Award, TrendingUp, Users, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: any;
  label: string;
  path: string;
  minGrade?: number;
  maxGrade?: number;
}

// Age-adaptive navigation items
const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Lessons", path: "/lessons" },
  { icon: Award, label: "Badges", path: "/badges" },
  { icon: Heart, label: "Feelings", path: "/dashboard", maxGrade: 5 }, // K-5 only
  { icon: TrendingUp, label: "Rewards", path: "/rewards" },
  { icon: Users, label: "Social", path: "/social", minGrade: 3 }, // Grade 3+
  { icon: Sparkles, label: "Challenges", path: "/dashboard", minGrade: 6 }, // Grade 6+
];

interface AgeAdaptiveNavProps {
  gradeLevel: number;
}

export const AgeAdaptiveNav = ({ gradeLevel }: AgeAdaptiveNavProps) => {
  const location = useLocation();

  // Filter nav items based on grade level
  const filteredItems = navItems.filter(item => {
    if (item.minGrade && gradeLevel < item.minGrade) return false;
    if (item.maxGrade && gradeLevel > item.maxGrade) return false;
    return true;
  });

  // Age-tier specific styling
  const getAgeTierStyles = () => {
    if (gradeLevel <= 2) {
      // K-2: Large, colorful, simple
      return {
        navClass: "gap-2 py-4",
        itemClass: "flex-col gap-2 py-4 px-4 rounded-xl text-base font-semibold",
        iconSize: "w-8 h-8",
      };
    } else if (gradeLevel <= 5) {
      // 3-5: Medium, balanced
      return {
        navClass: "gap-4 py-3",
        itemClass: "flex-col md:flex-row gap-2 py-3 px-3 rounded-lg text-sm font-medium",
        iconSize: "w-6 h-6",
      };
    } else if (gradeLevel <= 8) {
      // 6-8: Compact, organized
      return {
        navClass: "gap-6",
        itemClass: "flex-row gap-2 py-2 px-4 rounded-lg text-sm",
        iconSize: "w-5 h-5",
      };
    } else {
      // 9-12: Professional, minimal
      return {
        navClass: "gap-8",
        itemClass: "flex-row gap-2 py-2 px-3 rounded-md text-sm",
        iconSize: "w-4 h-4",
      };
    }
  };

  const styles = getAgeTierStyles();

  return (
    <nav className="sticky top-16 w-full border-b bg-background px-4">
      <div className="container mx-auto">
        <ul className={cn("flex items-center justify-around md:justify-start", styles.navClass)}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center smooth-transition relative",
                    styles.itemClass,
                    isActive
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={styles.iconSize} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
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
