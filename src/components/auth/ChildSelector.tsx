import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Child {
  id: string;
  name: string;
  grade_level: number;
  avatar_config: any;
  total_points: number;
}

interface ChildSelectorProps {
  children: Child[];
  onSelect: (childId: string) => void;
}

export const ChildSelector = ({ children, onSelect }: ChildSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {children.map((child) => (
        <Card
          key={child.id}
          className={cn(
            "p-6 cursor-pointer elevated-card hover-scale",
            "flex flex-col items-center gap-4 text-center"
          )}
          onClick={() => onSelect(child.id)}
        >
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {child.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-xl font-semibold">{child.name}</h3>
            <p className="text-sm text-muted-foreground">Grade {child.grade_level}</p>
            <p className="text-sm font-medium text-accent mt-2">{child.total_points} points</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
