import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "pending" | "approved" | "rejected" | "public" | "private" | "in_review" | "needs_revision" | "default";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusVariant, { bg: string; text: string; defaultLabel: string }> = {
  pending: {
    bg: "bg-warning/10",
    text: "text-warning",
    defaultLabel: "Pending",
  },
  approved: {
    bg: "bg-success/10",
    text: "text-success",
    defaultLabel: "Approved",
  },
  public: {
    bg: "bg-success/10",
    text: "text-success",
    defaultLabel: "Public",
  },
  rejected: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    defaultLabel: "Rejected",
  },
  private: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    defaultLabel: "Private",
  },
  in_review: {
    bg: "bg-primary/10",
    text: "text-primary",
    defaultLabel: "In Review",
  },
  needs_revision: {
    bg: "bg-warning/10",
    text: "text-warning",
    defaultLabel: "Needs Revision",
  },
  default: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    defaultLabel: "Unknown",
  },
};

/**
 * Semantic status badge using design system tokens
 */
export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.default;

  return (
    <Badge
      variant="secondary"
      className={cn(config.bg, config.text, "font-medium", className)}
    >
      {label || config.defaultLabel}
    </Badge>
  );
};

// Compact version for inline use
export const StatusIndicator = ({ status, label }: Pick<StatusBadgeProps, "status" | "label">) => {
  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={cn("text-xs px-2 py-1 rounded", config.bg, config.text)}>
      {label || config.defaultLabel}
    </span>
  );
};
