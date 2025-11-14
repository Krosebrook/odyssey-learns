import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HealthStatus } from '@/components/monitoring/HealthStatus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getMetricsSummary, clearMetrics } from '@/lib/performance';
import { getStoredErrors, clearStoredErrors } from '@/lib/errorHandler';

/**
 * System Health Dashboard - Admin Only
 * Monitors application health, performance metrics, and error logs
 */
export default function SystemHealth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      
      if (error) throw error;
      
      if (!data) {
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = () => {
    setMetrics(getMetricsSummary());
    setErrors(getStoredErrors());
  };

  const handleClearMetrics = () => {
    clearMetrics();
    loadDashboardData();
  };

  const handleClearErrors = () => {
    clearStoredErrors();
    loadDashboardData();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-3xl font-bold">System Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor application health, performance, and errors
            </p>
          </div>
          <Activity className="w-12 h-12 text-primary" />
        </div>

        {/* Health Status */}
        <HealthStatus />

        {/* Performance Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Performance Metrics</h2>
            </div>
            <Button onClick={handleClearMetrics} size="sm" variant="outline">
              Clear Metrics
            </Button>
          </div>

          {metrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No performance metrics recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{metric.name.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.count} samples
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{metric.avg.toFixed(2)}ms</p>
                    <p className="text-xs text-muted-foreground">
                      Min: {metric.min.toFixed(2)}ms | Max: {metric.max.toFixed(2)}ms
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Error Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-semibold">Error Log</h2>
              {errors.length > 0 && (
                <Badge variant="destructive">{errors.length}</Badge>
              )}
            </div>
            <Button onClick={handleClearErrors} size="sm" variant="outline">
              Clear Errors
            </Button>
          </div>

          {errors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium">✓ No critical errors recorded</p>
              <p className="text-sm text-muted-foreground mt-1">
                System is running smoothly
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error, index) => (
                <div key={index} className="p-4 border border-red-200 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {error.message}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        error.severity === 'critical'
                          ? 'border-red-500 text-red-700'
                          : error.severity === 'high'
                          ? 'border-orange-500 text-orange-700'
                          : 'border-yellow-500 text-yellow-700'
                      }
                    >
                      {error.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-200 space-y-1">
                    <p>Component: {error.context.component || 'unknown'}</p>
                    <p>Action: {error.context.action || 'unknown'}</p>
                    <p>Time: {new Date(error.context.timestamp).toLocaleString()}</p>
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded overflow-auto text-xs">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
