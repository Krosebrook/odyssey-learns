import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  Eye, Filter, Download, TrendingUp 
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReviewStats {
  total_reviews: number;
  pending_reviews: number;
  in_review: number;
  approved_reviews: number;
  rejected_reviews: number;
  needs_revision: number;
  avg_review_time_hours: number;
  avg_overall_score: number;
}

interface LessonReview {
  lesson_id: string;
  title: string;
  subject: string;
  grade_level: number;
  lesson_created_at: string;
  review_id: string;
  review_status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
  overall_score: number | null;
  reviewer_name: string | null;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status_label: string;
}

export function ContentReviewDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<LessonReview[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_review_statistics');

      if (statsError) throw statsError;
      setStats(statsData[0] as ReviewStats);

      // Load review dashboard
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('lesson_review_dashboard')
        .select('*')
        .order('lesson_created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData as LessonReview[]);

    } catch (error) {
      console.error('Failed to load review data:', error);
      toast.error('Failed to load review dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_review':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'needs_revision':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      case 'in_review':
        return 'bg-primary/10 text-primary';
      case 'needs_revision':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.review_status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_reviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.pending_reviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.approved_reviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_reviews 
                ? Math.round((stats.approved_reviews / stats.total_reviews) * 100)
                : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_overall_score 
                ? stats.avg_overall_score.toFixed(2)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 5.00
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Review Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lesson Reviews</CardTitle>
              <CardDescription>
                Review and approve AI-generated lessons
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats?.pending_reviews || 0})
              </TabsTrigger>
              <TabsTrigger value="in_review">
                In Review ({stats?.in_review || 0})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats?.approved_reviews || 0})
              </TabsTrigger>
              <TabsTrigger value="needs_revision">
                Needs Revision ({stats?.needs_revision || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No reviews found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviews.map((review) => (
                        <TableRow key={review.review_id}>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {review.title}
                          </TableCell>
                          <TableCell>{review.subject}</TableCell>
                          <TableCell>
                            {review.grade_level === 0 ? 'K' : review.grade_level}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(review.review_status)}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(review.review_status)}
                                {review.status_label}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {review.overall_score 
                              ? `${review.overall_score.toFixed(1)}/5.0`
                              : '—'
                            }
                          </TableCell>
                          <TableCell>
                            {review.reviewer_name || '—'}
                          </TableCell>
                          <TableCell>
                            {new Date(review.lesson_created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/review/${review.review_id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Review Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Average Review Time
              </p>
              <p className="text-2xl font-bold">
                {stats?.avg_review_time_hours 
                  ? `${stats.avg_review_time_hours.toFixed(1)} hours`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </p>
              <p className="text-2xl font-bold text-warning">
                {(stats?.needs_revision || 0) + (stats?.pending_reviews || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
