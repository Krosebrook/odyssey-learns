import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Award, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function ReviewerPerformance() {
  const [loading, setLoading] = useState(true);
  const [reviewers, setReviewers] = useState<any[]>([]);

  useEffect(() => {
    loadReviewerPerformance();
  }, []);

  const loadReviewerPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('reviewer_performance')
        .select('*')
        .order('total_reviews', { ascending: false });

      if (error) throw error;
      setReviewers(data || []);
    } catch (error) {
      console.error('Failed to load reviewer performance:', error);
      toast.error('Failed to load reviewer data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Reviewer Performance
        </CardTitle>
        <CardDescription>Performance metrics for all content reviewers</CardDescription>
      </CardHeader>
      <CardContent>
        {reviewers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reviewer data available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead className="text-right">Total Reviews</TableHead>
                <TableHead className="text-right">Avg Time (min)</TableHead>
                <TableHead className="text-right">Avg Score Given</TableHead>
                <TableHead className="text-right">This Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewers.map((reviewer) => (
                <TableRow key={reviewer.id}>
                  <TableCell className="font-medium">
                    Reviewer #{reviewer.reviewer_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{reviewer.total_reviews}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {reviewer.avg_review_time_minutes?.toFixed(1) || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {reviewer.avg_score_given?.toFixed(1) || 0}/5
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      {reviewer.reviews_this_week || 0}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
