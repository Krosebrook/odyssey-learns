import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordMetric,
  createTimer,
  measureAsync,
  getMetrics,
  getMetricsSummary,
  clearMetrics,
} from '../performance';

describe('performance utilities', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      recordMetric('test_metric', 100, 'ms');
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].unit).toBe('ms');
    });

    it('should record metric with metadata', () => {
      recordMetric('api_call', 250, 'ms', { endpoint: '/api/lessons' });
      const metrics = getMetrics();
      expect(metrics[0].metadata).toEqual({ endpoint: '/api/lessons' });
    });

    it('should limit metrics to MAX_METRICS', () => {
      // Record 150 metrics (more than MAX_METRICS of 100)
      for (let i = 0; i < 150; i++) {
        recordMetric(`metric_${i}`, i, 'ms');
      }
      const metrics = getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });

    it('should use default unit of ms', () => {
      recordMetric('test', 50);
      const metrics = getMetrics();
      expect(metrics[0].unit).toBe('ms');
    });

    it('should record timestamp', () => {
      const before = Date.now();
      recordMetric('test', 100);
      const after = Date.now();
      const metrics = getMetrics();
      expect(metrics[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(metrics[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createTimer', () => {
    it('should measure elapsed time', async () => {
      const timer = createTimer('test_timer');
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = timer.end();
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should record metric when timer ends', () => {
      const timer = createTimer('test_timer');
      timer.end();
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_timer');
    });

    it('should include metadata in metric', () => {
      const timer = createTimer('test_timer');
      timer.end({ operation: 'database_query' });
      const metrics = getMetrics();
      expect(metrics[0].metadata).toEqual({ operation: 'database_query' });
    });
  });

  describe('measureAsync', () => {
    it('should measure async operation duration', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };
      
      const result = await measureAsync('async_test', operation);
      expect(result).toBe('result');
      
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async_test');
      expect(metrics[0].metadata?.status).toBe('success');
    });

    it('should handle errors and still record metric', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Test error');
      };
      
      await expect(measureAsync('async_error', operation)).rejects.toThrow('Test error');
      
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata?.status).toBe('error');
    });

    it('should include custom metadata', async () => {
      const operation = async () => 'result';
      await measureAsync('async_test', operation, { userId: '123' });
      
      const metrics = getMetrics();
      expect(metrics[0].metadata?.userId).toBe('123');
      expect(metrics[0].metadata?.status).toBe('success');
    });
  });

  describe('getMetricsSummary', () => {
    it('should calculate summary statistics', () => {
      recordMetric('api_call', 100, 'ms');
      recordMetric('api_call', 200, 'ms');
      recordMetric('api_call', 300, 'ms');
      
      const summary = getMetricsSummary();
      expect(summary).toHaveLength(1);
      expect(summary[0].name).toBe('api_call');
      expect(summary[0].count).toBe(3);
      expect(summary[0].avg).toBe(200);
      expect(summary[0].min).toBe(100);
      expect(summary[0].max).toBe(300);
    });

    it('should group metrics by name', () => {
      recordMetric('api_call', 100, 'ms');
      recordMetric('db_query', 50, 'ms');
      recordMetric('api_call', 150, 'ms');
      
      const summary = getMetricsSummary();
      expect(summary).toHaveLength(2);
      
      const apiSummary = summary.find(s => s.name === 'api_call');
      expect(apiSummary?.count).toBe(2);
      expect(apiSummary?.avg).toBe(125);
      
      const dbSummary = summary.find(s => s.name === 'db_query');
      expect(dbSummary?.count).toBe(1);
      expect(dbSummary?.avg).toBe(50);
    });

    it('should return empty array when no metrics', () => {
      const summary = getMetricsSummary();
      expect(summary).toHaveLength(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      recordMetric('test1', 100, 'ms');
      recordMetric('test2', 200, 'ms');
      expect(getMetrics()).toHaveLength(2);
      
      clearMetrics();
      expect(getMetrics()).toHaveLength(0);
    });
  });

  describe('getMetrics', () => {
    it('should return a copy of metrics array', () => {
      recordMetric('test', 100, 'ms');
      const metrics1 = getMetrics();
      const metrics2 = getMetrics();
      
      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });
});
