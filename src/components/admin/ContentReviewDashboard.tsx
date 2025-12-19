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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  Eye, Filter, Download, TrendingUp, ChevronDown, CheckSquare 
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
  priority?: string;
}

export function ContentReviewDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<LessonReview[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

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

  const handleAutoAssign = async () => {
    try {
      const { data, error } = await supabase.rpc('auto_assign_pending_reviews');
      if (error) throw error;
      
      const result = data as { success: boolean; assigned_count: number; message: string };
      toast.success(`${result.assigned_count} reviews auto-assigned successfully`);
      loadReviewData();
    } catch (error) {
      console.error('Auto-assign failed:', error);
      toast.error('Failed to auto-assign reviews');
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
    if (filter !== 'all' && review.review_status !== filter) return false;
    if (priorityFilter !== 'all' && review.priority !== priorityFilter) return false;
    return true;
  });

  const toggleReviewSelection = (reviewId: string) => {
    const newSelection = new Set(selectedReviews);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setSelectedReviews(newSelection);
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const updates = Array.from(selectedReviews).map(reviewId =>
        supabase
          .from('lesson_reviews')
          .update({ status: 'approved', completed_at: new Date().toISOString() })
          .eq('id', reviewId)
      );

      await Promise.all(updates);
      toast.success(`Approved ${selectedReviews.size} reviews`);
      setSelectedReviews(new Set());
      loadReviewData();
    } catch (error) {
      toast.error('Failed to approve reviews');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedReviews.size === 0) return;
    
    const confirmed = confirm(`Reject ${selectedReviews.size} lessons?`);
    if (!confirmed) return;

    setBulkActionLoading(true);
    try {
      const updates = Array.from(selectedReviews).map(reviewId =>
        supabase
          .from('lesson_reviews')
          .update({ status: 'rejected', completed_at: new Date().toISOString() })
          .eq('id', reviewId)
      );

      await Promise.all(updates);
      toast.success(`Rejected ${selectedReviews.size} reviews`);
      setSelectedReviews(new Set());
      loadReviewData();
    } catch (error) {
      toast.error('Failed to reject reviews');
    } finally {
      setBulkActionLoading(false);
    }
  };

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

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="needs_revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="0">Kindergarten</SelectItem>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="math">Math</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="social">Social Studies</SelectItem>
              <SelectItem value="lifeskills">Life Skills</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleAutoAssign} variant="outline">
            Auto-Assign Reviews
          </Button>
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
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedReviews.size === filteredReviews.length && filteredReviews.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReviews(new Set(filteredReviews.map(r => r.review_id)));
                            } else {
                              setSelectedReviews(new Set());
                            }
                          }}
                        />
                      </TableHead>
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
                          <TableCell>
                            <Checkbox
                              checked={selectedReviews.has(review.review_id)}
                              onCheckedChange={() => toggleReviewSelection(review.review_id)}
                            />
                          </TableCell>
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
