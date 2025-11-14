import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Zap, RefreshCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  database: 'ok' | 'slow' | 'error';
  gemini: 'ok' | 'error' | 'disabled';
  safe_mode: boolean;
  kill_switch: boolean;
  version: string;
  timestamp: string;
  latency_ms: number;
}

/**
 * Health status monitoring component for admin dashboard
 * Shows real-time system health and performance metrics
 */
export const HealthStatus = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('health-check');
      
      if (fnError) throw fnError;
      
      setHealth(data as HealthCheckResponse);
      setLastCheck(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'bg-green-500';
      case 'slow':
      case 'degraded':
        return 'bg-yellow-500';
      case 'error':
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return <Badge variant="outline" className="border-green-500 text-green-700">Healthy</Badge>;
      case 'slow':
      case 'degraded':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Degraded</Badge>;
      case 'error':
      case 'down':
        return <Badge variant="outline" className="border-red-500 text-red-700">Down</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Disabled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
              Health Check Failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 mb-3">{error}</p>
            <Button onClick={checkHealth} size="sm" variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        <Button onClick={checkHealth} size="sm" variant="outline" disabled={loading}>
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && !health ? (
        <div className="space-y-3">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
      ) : health ? (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(health.status)} animate-pulse`} />
              <span className="font-medium">Overall Status</span>
            </div>
            {getStatusBadge(health.status)}
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Database</span>
            </div>
            {getStatusBadge(health.database)}
          </div>

          {/* AI Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">AI Service (Gemini)</span>
            </div>
            {getStatusBadge(health.gemini)}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Response Time</p>
              <p className="text-2xl font-bold">
                {health.latency_ms}
                <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <p className="text-2xl font-bold">{health.version}</p>
            </div>
          </div>

          {/* Config Flags */}
          {(health.safe_mode || health.kill_switch) && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ System Flags Active
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                {health.safe_mode && <li>• Safe Mode: AI generation disabled</li>}
                {health.kill_switch && <li>• Kill Switch: Emergency mode active</li>}
              </ul>
            </div>
          )}

          {/* Last Check */}
          <p className="text-xs text-muted-foreground text-center">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        </div>
      ) : null}
    </Card>
  );
};
