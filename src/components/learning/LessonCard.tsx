import { Card } from "@/components/ui/card";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { StatusIndicator } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    subject: string;
    estimated_minutes?: number;
    points_value?: number;
    share_status?: string;
    times_used?: number;
  };
  onClick?: () => void;
  onShare?: () => void;
  showStats?: boolean;
  className?: string;
}

/**
 * Reusable lesson card component with consistent styling
 */
export const LessonCard = ({
  lesson,
  onClick,
  onShare,
  showStats = true,
  className,
}: LessonCardProps) => {
  return (
    <Card
      className={cn(
        "p-6 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <SubjectBadge subject={lesson.subject as any} />
        {lesson.share_status && (
          <div className="flex items-center gap-2">
            {lesson.share_status === "private" && onShare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            )}
            {lesson.share_status === "pending_approval" && (
              <StatusIndicator status="pending" label="Pending" />
            )}
            {lesson.share_status === "public" && (
              <StatusIndicator status="public" label="Public" />
            )}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{lesson.title}</h3>

      {lesson.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {lesson.description}
        </p>
      )}

      {showStats && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4 mt-auto">
          {lesson.estimated_minutes !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lesson.estimated_minutes} min
            </div>
          )}
          {lesson.points_value !== undefined && (
            <div className="flex items-center gap-1 text-accent font-medium">
              <Star className="w-4 h-4" />+{lesson.points_value} pts
            </div>
          )}
        </div>
      )}

      {lesson.share_status === "public" && lesson.times_used !== undefined && (
        <p className="text-xs text-muted-foreground mt-2">
          Used {lesson.times_used} times • Earned {lesson.times_used * 10} points
        </p>
      )}
    </Card>
  );
};

/**
 * Compact version for My Lessons list
 */
export const LessonCardCompact = ({
  lesson,
  onClick,
  onShare,
}: Omit<LessonCardProps, "showStats" | "className">) => {
  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <SubjectBadge subject={lesson.subject as any} />
        {lesson.share_status && (
          <div className="flex items-center gap-1">
            {lesson.share_status === "private" && onShare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            )}
            {lesson.share_status === "pending_approval" && (
              <StatusIndicator status="pending" label="Pending" />
            )}
            {lesson.share_status === "public" && (
              <StatusIndicator status="public" label="Public" />
            )}
          </div>
        )}
      </div>
      <h4 className="font-semibold mb-1">{lesson.title}</h4>
      {lesson.description && (
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {lesson.description}
        </p>
      )}
      {lesson.share_status === "public" && lesson.times_used !== undefined && (
        <p className="text-xs text-muted-foreground">
          Used {lesson.times_used} times • Earned {lesson.times_used * 10} points
        </p>
      )}
    </Card>
  );
};
