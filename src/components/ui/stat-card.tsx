import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  variant?: "default" | "primary" | "accent" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  default: "bg-muted/50",
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
};

/**
 * Consistent stat display card for dashboards
 */
export const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  variant = "default",
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
              variantStyles[variant]
            )}
          >
            <Icon
              className={cn("w-6 h-6", iconVariantStyles[variant], iconClassName)}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold truncate">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Compact inline stat for headers/summaries
 */
export const InlineStat = ({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}) => {
  const textVariants = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="text-center">
      <p className={cn("text-2xl font-bold", textVariants[variant])}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};
