import { LucideIcon } from "lucide-react";

interface AuthHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  showLogo?: boolean;
}

/**
 * Reusable header for auth pages with optional logo or icon
 */
export const AuthHeader = ({ 
  icon: Icon, 
  title, 
  description,
  showLogo = false 
}: AuthHeaderProps) => {
  return (
    <div className="text-center space-y-4">
      {showLogo ? (
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark items-center justify-center shadow-elevated">
          <span className="text-3xl font-bold text-primary-foreground">IO</span>
        </div>
      ) : Icon ? (
        <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      ) : null}
      
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base">{description}</p>
        )}
      </div>
    </div>
  );
};
