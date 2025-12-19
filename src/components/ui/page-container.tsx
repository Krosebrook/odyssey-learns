import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

/**
 * Consistent page container with responsive padding and max-width
 */
export const PageContainer = ({
  children,
  className,
  maxWidth = "2xl",
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Full-width section with consistent vertical padding
 */
export const PageSection = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
};

/**
 * Section header with title, optional badge, and description
 */
export const SectionHeader = ({
  badge,
  title,
  description,
  className,
  align = "center",
}: {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) => {
  return (
    <div
      className={cn(
        "space-y-4 mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-lg text-muted-foreground",
            align === "center" && "max-w-2xl mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
};
