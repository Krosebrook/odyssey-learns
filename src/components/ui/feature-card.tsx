import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: "primary" | "secondary" | "accent";
  className?: string;
}

/**
 * Feature card with icon, title, and description
 * Uses design system tokens for consistent styling
 */
export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  iconColor = "primary",
  className,
}: FeatureCardProps) => {
  const iconColorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <Card
      className={cn(
        "elevated-card hover-scale transition-all duration-300 border-2",
        className
      )}
    >
      <CardHeader>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
          <Icon className={cn("h-7 w-7", iconColorClasses[iconColor])} />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

interface BenefitItemProps {
  icon: LucideIcon;
  text: string;
  className?: string;
}

/**
 * Benefit item with icon and text for lists
 */
export const BenefitItem = ({ icon: Icon, text, className }: BenefitItemProps) => {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm leading-relaxed pt-1 text-foreground">{text}</p>
    </div>
  );
};
