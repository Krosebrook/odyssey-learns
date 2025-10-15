import { cn } from "@/lib/utils";
import { Book, Calculator, Microscope, Globe, Heart } from "lucide-react";

type Subject = "reading" | "math" | "science" | "social" | "lifeskills";

interface SubjectBadgeProps {
  subject: Subject;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SubjectBadge = ({ subject, size = "md", className }: SubjectBadgeProps) => {
  const icons = {
    reading: Book,
    math: Calculator,
    science: Microscope,
    social: Globe,
    lifeskills: Heart
  };

  const colors = {
    reading: "bg-reading/10 text-reading border-reading/20",
    math: "bg-math/10 text-math border-math/20",
    science: "bg-science/10 text-science border-science/20",
    social: "bg-social/10 text-social border-social/20",
    lifeskills: "bg-lifeskills/10 text-lifeskills border-lifeskills/20"
  };

  const sizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const Icon = icons[subject];
  const label = subject.charAt(0).toUpperCase() + subject.slice(1);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium capitalize smooth-transition",
        colors[subject],
        sizes[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <span>{label}</span>
    </div>
  );
};
