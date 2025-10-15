import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ParentSetup = () => {
  const [childName, setChildName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in first");
      navigate('/login');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('children')
      .insert({
        parent_id: user.id,
        name: childName,
        grade_level: parseInt(gradeLevel),
      });

    if (error) {
      toast.error("Failed to create child profile");
      setLoading(false);
    } else {
      toast.success("Child profile created!");
      navigate('/parent-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md p-8 elevated-card animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Your First Child Profile</h1>
          <p className="text-muted-foreground">
            Let's get started on their learning journey!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="childName">Child's Name</Label>
            <Input
              id="childName"
              type="text"
              placeholder="e.g., Emma"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
              className="focus-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Input
              id="gradeLevel"
              type="number"
              min="0"
              max="12"
              placeholder="0-12"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
              className="focus-ring"
            />
            <p className="text-xs text-muted-foreground">
              Enter 0 for Kindergarten
            </p>
          </div>

          <Button
            type="submit"
            className="w-full hover-scale"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : "Create Profile"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/parent-dashboard')}
            className="text-sm"
          >
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ParentSetup;
