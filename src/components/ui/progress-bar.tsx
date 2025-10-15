import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

export const ProgressBar = ({ 
  value, 
  max = 100, 
  color = "primary",
  className 
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-success",
    warning: "bg-warning"
  };

  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full",
          colorClasses[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
