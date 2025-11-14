/**
 * Performance monitoring utilities for production
 * Tracks page load times, component render times, and API response times
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes';
  timestamp: number;
  metadata?: Record<string, any>;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Record a performance metric
 */
export const recordMetric = (
  name: string,
  value: number,
  unit: 'ms' | 's' | 'bytes' = 'ms',
  metadata?: Record<string, any>
) => {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    metadata,
  };

  metrics.push(metric);

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // Log slow operations
  if (unit === 'ms' && value > 1000) {
    console.warn(`[Performance] Slow operation: ${name} took ${value}ms`, metadata);
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service (DataDog, New Relic, etc.)
  }
};

/**
 * Measure page load performance
 */
export const measurePageLoad = () => {
  if ('performance' in window && 'timing' in performance) {
    const timing = performance.timing;
    
    // Page load time
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    recordMetric('page_load', pageLoadTime, 'ms', {
      url: window.location.pathname,
    });

    // DNS lookup time
    const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
    recordMetric('dns_lookup', dnsTime, 'ms');

    // Server response time
    const responseTime = timing.responseEnd - timing.requestStart;
    recordMetric('server_response', responseTime, 'ms');

    // DOM ready time
    const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
    recordMetric('dom_ready', domReadyTime, 'ms');
  }
};

/**
 * Create a performance timer
 */
export const createTimer = (label: string) => {
  const start = performance.now();
  
  return {
    end: (metadata?: Record<string, any>) => {
      const duration = performance.now() - start;
      recordMetric(label, duration, 'ms', metadata);
      return duration;
    },
  };
};

/**
 * Measure async operation performance
 */
export const measureAsync = async <T>(
  label: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const timer = createTimer(label);
  
  try {
    const result = await operation();
    timer.end({ ...metadata, status: 'success' });
    return result;
  } catch (error) {
    timer.end({ ...metadata, status: 'error', error: String(error) });
    throw error;
  }
};

/**
 * Get all recorded metrics
 */
export const getMetrics = (): PerformanceMetric[] => {
  return [...metrics];
};

/**
 * Get metrics summary
 */
export const getMetricsSummary = () => {
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric.value);
    return acc;
  }, {} as Record<string, number[]>);

  return Object.entries(grouped).map(([name, values]) => ({
    name,
    count: values.length,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  }));
};

/**
 * Clear all metrics
 */
export const clearMetrics = () => {
  metrics.length = 0;
};

/**
 * Initialize performance monitoring
 */
export const initializePerformanceMonitoring = () => {
  // Measure initial page load
  if (document.readyState === 'complete') {
    measurePageLoad();
  } else {
    window.addEventListener('load', measurePageLoad);
  }

  // Monitor long tasks (tasks taking >50ms)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            recordMetric('long_task', entry.duration, 'ms', {
              name: entry.name,
              startTime: entry.startTime,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported or longtask not available
    }
  }

  console.log('[Performance] Monitoring initialized');
};
