# Monitoring & Observability Guide

## Table of Contents
- [Monitoring Overview](#monitoring-overview)
- [Application Monitoring](#application-monitoring)
- [Database Monitoring](#database-monitoring)
- [Edge Function Monitoring](#edge-function-monitoring)
- [Performance Monitoring](#performance-monitoring)
- [Security Monitoring](#security-monitoring)
- [Alerting & Notifications](#alerting--notifications)
- [Incident Response](#incident-response)
- [Metrics & Dashboards](#metrics--dashboards)

---

## Monitoring Overview

### Monitoring Philosophy

**Goals:**
1. **Proactive Detection:** Identify issues before users report them
2. **Rapid Response:** Alert on-call engineer within 5 minutes of incident
3. **Root Cause Analysis:** Provide context to diagnose issues quickly
4. **Continuous Improvement:** Track performance trends over time

**Three Pillars of Observability:**
1. **Metrics:** Quantitative measurements (error rates, response times)
2. **Logs:** Timestamped event records (function executions, errors)
3. **Traces:** Request flow through system (not yet implemented)

---

### Monitoring Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Data Collection Layer                   │
│                                                          │
│  Frontend (Browser)  →  Performance API, Error Handler  │
│  Backend (Edge Fns)  →  Console Logs, Deno.metrics     │
│  Database (Postgres) →  pg_stat_*, query logs          │
│                                                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│              Aggregation & Storage Layer                 │
│                                                          │
│  Lovable Cloud Monitor  →  Metrics aggregation          │
│  Supabase Logs          →  Function/DB log storage      │
│  Custom Analytics Table →  Application-specific events  │
│                                                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│               Visualization & Alerting Layer             │
│                                                          │
│  Dashboards  →  Real-time metrics (Backend → Monitor)   │
│  Alerts      →  Email + Slack webhooks (thresholds)     │
│  Reports     →  Weekly summaries (generated via cron)   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Application Monitoring

### Health Check Endpoint

**Endpoint:** `/functions/v1/health-check`

**Purpose:** Verify all system components are operational

**Implementation:**
```typescript
// supabase/functions/health-check/index.ts
Deno.serve(async (req) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkEdgeFunctions(),
  ]);
  
  const allHealthy = checks.every(c => c.status === 'healthy');
  
  return new Response(JSON.stringify({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    checks: {
      database: checks[0].status,
      auth: checks[1].status,
      edge_functions: checks[2].status,
    }
  }), {
    status: allHealthy ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Monitoring:**
- **Frequency:** Every 5 minutes
- **Timeout:** 10 seconds
- **Alert:** 3 consecutive failures

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00Z",
  "version": "1.2.0",
  "checks": {
    "database": "healthy",
    "auth": "healthy",
    "edge_functions": "healthy"
  }
}
```

---

### Uptime Monitoring

**Service:** External uptime monitor (UptimeRobot, Pingdom, or similar)

**Configuration:**
- **URL:** `https://app.innerodyssey.com`
- **Method:** GET
- **Expected Status:** 200
- **Check Interval:** 5 minutes
- **Locations:** US East, EU West, Asia Pacific

**SLA Targets:**
| Timeframe | Target Uptime | Allowed Downtime |
|-----------|---------------|------------------|
| Monthly | 99.5% | ~3.6 hours |
| Quarterly | 99.7% | ~6.5 hours |
| Yearly | 99.8% | ~17.5 hours |

**Incident Response:**
- **<99.5% Monthly:** Post-mortem required
- **<99.0% Monthly:** Executive review + action plan

---

### Error Tracking

**Frontend Error Handler:**
```typescript
// src/lib/errorHandler.ts
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const handleError = (
  error: Error,
  context: {
    severity: ErrorSeverity;
    userId?: string;
    metadata?: Record<string, any>;
  }
) => {
  // Log to console
  console.error(`[${context.severity.toUpperCase()}]`, error.message, context);
  
  // Send to monitoring service (future: Sentry integration)
  trackError({
    message: error.message,
    stack: error.stack,
    severity: context.severity,
    userId: context.userId,
    metadata: context.metadata,
    timestamp: new Date().toISOString(),
  });
  
  // Alert on critical errors
  if (context.severity === ErrorSeverity.CRITICAL) {
    sendAlert({
      type: 'critical_error',
      message: error.message,
      userId: context.userId,
    });
  }
};
```

**Usage:**
```typescript
try {
  await generateCustomLesson(prompt);
} catch (error) {
  handleError(error, {
    context: 'LessonGeneration',
    severity: ErrorSeverity.HIGH,
    userId: user.id,
    metadata: { prompt, gradeLevel }
  });
  
  toast.error('Failed to generate lesson. Please try again.');
}
```

---

### Error Rate Metrics

**Target Error Rates:**
| Component | Target | Alert Threshold |
|-----------|--------|-----------------|
| Frontend (JavaScript errors) | <1% of page views | >2% for 10 minutes |
| Edge Functions | <2% of invocations | >5% for 5 minutes |
| Database Queries | <0.5% of queries | >1% for 10 minutes |

**Monitoring Query:**
```sql
-- Calculate edge function error rate (last hour)
SELECT 
  'edge_functions' as component,
  COUNT(*) FILTER (WHERE status >= 400) as errors,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE status >= 400)::NUMERIC / COUNT(*) * 100, 2) as error_rate_pct
FROM edge_function_logs
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

---

## Database Monitoring

### Key Metrics

**1. Connection Count:**
```sql
-- Current active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Connection limit
SELECT setting::int as max_connections
FROM pg_settings
WHERE name = 'max_connections';

-- Alert if > 80% capacity
```

**2. Slow Queries:**
```sql
-- Queries taking >1 second (last hour)
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000 -- milliseconds
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**3. Table Sizes:**
```sql
-- Largest tables (monitor growth rate)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 10;
```

**4. Index Usage:**
```sql
-- Unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

### Database Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Query Response Time (p95) | <100ms | >500ms |
| Connection Pool Usage | <70% | >85% |
| Table Bloat | <20% | >40% |
| Index Hit Ratio | >99% | <95% |
| Replication Lag | <1s | >5s |

---

### Database Alerts

**Critical Alerts (Immediate Response):**
1. **Connection Pool Exhausted:** >95% connections used
2. **Disk Full:** >90% disk usage
3. **Replication Failure:** Replica lag >30s
4. **Query Timeout:** Any query >30s

**Warning Alerts (Review Within 24h):**
1. **Slow Query Trend:** Mean query time increased >50% week-over-week
2. **Table Bloat:** Any table >30% bloat
3. **Unused Indexes:** Index not scanned in 30 days
4. **High Lock Wait:** Lock wait time >10% of query time

---

## Edge Function Monitoring

### Function Logs

**Access:** Backend → Edge Functions → [Function Name] → Logs

**Log Levels:**
```typescript
// In edge function code
console.log('[INFO]', 'Lesson generation started', { childId, prompt });
console.warn('[WARN]', 'Rate limit approaching', { count: 4, limit: 5 });
console.error('[ERROR]', 'AI API call failed', { error: error.message });
```

**Structured Logging:**
```typescript
const log = (level: string, message: string, metadata?: any) => {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    function: 'generate-custom-lesson',
    ...metadata
  }));
};

// Usage
log('info', 'Lesson generated', { lessonId, duration: 3200 });
```

---

### Function Performance Metrics

**Key Metrics:**
```typescript
// Automatically tracked by Lovable Cloud
{
  invocations: 1234,           // Total calls (last 24h)
  errors: 23,                  // Failed invocations
  error_rate: 1.86,            // Percentage
  avg_duration_ms: 2341,       // Mean execution time
  p50_duration_ms: 1890,       // Median
  p95_duration_ms: 4567,       // 95th percentile
  p99_duration_ms: 8901,       // 99th percentile
  cold_starts: 12,             // Function initializations
  timeout_rate: 0.05           // Percentage
}
```

**Target Thresholds:**
| Function | p95 Duration | Error Rate | Timeout Rate |
|----------|--------------|------------|--------------|
| `generate-custom-lesson` | <5s | <3% | <1% |
| `ai-insights` | <3s | <2% | <0.5% |
| `generate-weekly-reports` | <10s | <1% | <0.5% |
| `track-lesson-analytics` | <500ms | <1% | <0.1% |

---

### Function Alerts

**Critical (Immediate):**
1. **Function Failure Spike:** Error rate >10% for 5 minutes
2. **Timeout Epidemic:** Timeout rate >5% for 5 minutes
3. **Cold Start Storm:** >50 cold starts in 10 minutes (indicates scaling issue)

**Warning (Review Within 4h):**
1. **Slow Performance:** p95 duration increased >50% compared to 24h ago
2. **Elevated Errors:** Error rate 3-10% for 15 minutes
3. **Memory Pressure:** Function approaching memory limit (>90%)

---

## Performance Monitoring

### Core Web Vitals Tracking

**Implementation:**
```typescript
// src/main.tsx
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

const reportWebVitals = (metric: any) => {
  // Send to analytics service
  console.log(metric.name, metric.value);
  
  // Track in database (optional)
  supabase.from('performance_metrics').insert({
    metric_name: metric.name,
    metric_value: metric.value,
    page_url: window.location.pathname,
    timestamp: new Date().toISOString()
  });
};

onCLS(reportWebVitals);
onFID(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);
```

**Target Metrics:**
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5-4s | >4s |
| FID | <100ms | 100-300ms | >300ms |
| CLS | <0.1 | 0.1-0.25 | >0.25 |

**Alert Thresholds:**
- **LCP >4s** for >25% of page views (24h window)
- **FID >300ms** for >10% of interactions (24h window)
- **CLS >0.25** for >5% of page views (24h window)

---

### Custom Performance Monitoring

**Using built-in performance utilities:**
```typescript
import { measureAsync, getMetricsSummary } from '@/lib/performance';

// Measure critical user flows
const handleLessonCompletion = async () => {
  await measureAsync('lesson-completion', async () => {
    await submitQuiz();
    await updateProgress();
    await awardPoints();
    await checkBadges();
  });
  
  // Log summary periodically
  const summary = getMetricsSummary();
  console.table(summary);
};
```

---

## Security Monitoring

### Access Logs

**Sensitive Data Access Tracking:**
```sql
-- Check emotion log access (should be parent only)
SELECT 
  user_id,
  accessed_table,
  access_type,
  COUNT(*) as access_count,
  MAX(accessed_at) as last_access
FROM security_access_log
WHERE accessed_table = 'emotion_logs'
  AND accessed_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, accessed_table, access_type
ORDER BY access_count DESC;
```

**Unauthorized Access Attempts:**
```sql
-- Failed access attempts (RLS violations)
SELECT 
  user_id,
  accessed_table,
  access_type,
  error_message,
  COUNT(*) as attempt_count
FROM security_access_log
WHERE success = false
  AND accessed_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, accessed_table, access_type, error_message
HAVING COUNT(*) > 5; -- Alert on repeated failures
```

---

### Rate Limit Violations

**Monitor abusive behavior:**
```sql
-- Users hitting rate limits
SELECT 
  parent_id,
  violation_type,
  COUNT(*) as violation_count,
  MAX(created_at) as last_violation
FROM rate_limit_violations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY parent_id, violation_type
ORDER BY violation_count DESC;

-- Alert if single user has >10 violations in 24h
```

---

### Security Alerts

**Critical (Immediate):**
1. **RLS Bypass Attempt:** User accessing data outside their RLS scope
2. **Brute Force Attack:** >20 failed login attempts from single IP in 10 minutes
3. **Data Exfiltration:** Single user querying >1000 emotion logs in 1 hour
4. **Privilege Escalation:** Non-admin attempting admin-only operations

**Warning (Review Within 4h):**
1. **Suspicious Access Pattern:** User accessing unusual tables/columns
2. **Rate Limit Abuse:** User hitting rate limits 5+ times in 24h
3. **Failed Auth Attempts:** 5-20 failed logins from single IP in 10 minutes

---

## Alerting & Notifications

### Alert Channels

**Email Alerts:**
- **Recipients:** `dev-team@innerodyssey.com`, on-call engineer
- **Triggered For:** Critical alerts only
- **Format:** Plain text with context, link to logs

**Slack Alerts:**
- **Channel:** `#alerts-production`
- **Triggered For:** Critical + Warning alerts
- **Format:** Structured message with severity, context, runbook link

**SMS Alerts (Future):**
- **Recipients:** On-call engineer only
- **Triggered For:** P0/P1 critical incidents (database down, data breach)

---

### Alert Configuration

**Alert Structure:**
```json
{
  "alert_id": "edge-function-high-error-rate",
  "severity": "critical",
  "title": "Edge Function Error Rate Exceeded",
  "description": "generate-custom-lesson error rate: 12.3% (threshold: 5%)",
  "timestamp": "2025-11-15T10:35:00Z",
  "context": {
    "function": "generate-custom-lesson",
    "error_rate": 12.3,
    "threshold": 5.0,
    "window": "5 minutes",
    "sample_errors": [
      "API key invalid",
      "Timeout after 30s",
      "Rate limit exceeded"
    ]
  },
  "runbook_url": "https://docs.innerodyssey.com/runbooks/edge-function-errors",
  "dashboard_url": "https://app.lovable.dev/monitor"
}
```

---

### Alert Escalation

**Tier 1 (Automated):**
- Send email + Slack notification
- Wait 5 minutes

**Tier 2 (Automated):**
- If not acknowledged, send SMS to on-call engineer
- Wait 10 minutes

**Tier 3 (Manual):**
- If still not resolved, escalate to engineering manager
- Initiate incident response protocol

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 (Critical)** | Complete outage, data loss risk | 15 minutes | Database down, data breach |
| **P1 (High)** | Major feature broken, affects >50% users | 1 hour | Lesson generation failing |
| **P2 (Medium)** | Minor feature broken, affects <50% users | 4 hours | Badge unlock delayed |
| **P3 (Low)** | Cosmetic issue, no user impact | Next business day | UI element misaligned |

---

### Incident Response Workflow

**1. Detection (0-5 minutes):**
- Alert triggered (monitoring system)
- On-call engineer paged

**2. Triage (5-15 minutes):**
- Assess severity (P0-P3)
- Determine impact (% users affected)
- Check recent deployments (rollback candidate?)
- Review logs (identify root cause)

**3. Mitigation (15-60 minutes):**
- Apply immediate fix (rollback, hotfix, disable feature)
- Communicate status (internal Slack, external status page if P0/P1)
- Monitor for recovery

**4. Resolution (1-24 hours):**
- Deploy permanent fix
- Verify issue resolved
- Close incident

**5. Post-Mortem (24-72 hours):**
- Document timeline
- Identify root cause
- Define action items to prevent recurrence
- Review with team

---

### Incident Communication Template

**Internal (Slack):**
```
🚨 [P1] Lesson Generation Failing

**Status:** Investigating
**Impact:** 87% of lesson generation attempts failing (last 10 min)
**Started:** 2025-11-15 10:30 UTC
**Owner:** @john-engineer

**Timeline:**
10:30 - Alert triggered (high error rate)
10:32 - Incident opened, investigating edge function logs
10:35 - Root cause identified: GEMINI_API_KEY expired
10:37 - Rotating API key now

**Next Update:** 15 minutes or when resolved
```

**External (Status Page - if P0/P1):**
```
⚠️ Lesson Creation Issues

We're experiencing issues with custom lesson generation. 
Users may see errors when creating new lessons.

Our team is actively working on a fix.

Last updated: 10:35 UTC
Next update: 10:50 UTC
```

---

## Metrics & Dashboards

### Real-Time Dashboard

**Access:** Backend → Monitor

**Key Metrics (Refreshed Every 30 seconds):**
1. **Uptime:** Current status (healthy/degraded)
2. **Error Rates:** Frontend, backend, database (last hour)
3. **Response Times:** p50, p95, p99 (last hour)
4. **Active Users:** Current concurrent users
5. **Request Rate:** Requests per minute
6. **Edge Functions:** Invocation count, error rate per function

---

### Custom Analytics Dashboard

**Access:** Internal analytics tool (future: Grafana/Metabase)

**Daily Metrics:**
- Total users (active, new signups)
- Lesson completions (by grade level, subject)
- Custom lesson generation (attempts, successes, failures)
- Badge unlocks
- Parent engagement (dashboard views, message sent)

**Weekly Metrics:**
- User retention (7-day, 30-day)
- Lesson completion rate
- Average time per session
- Most popular lessons
- Feature adoption rates

---

### Example Queries for Dashboards

**Active Users (Last 24h):**
```sql
SELECT COUNT(DISTINCT child_id) as active_children
FROM user_progress
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Lesson Completion Rate (Last 7 Days):**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100, 2) as completion_rate
FROM user_progress
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Top Performing Lessons:**
```sql
SELECT 
  l.title,
  COUNT(up.id) as attempts,
  COUNT(*) FILTER (WHERE up.status = 'completed') as completions,
  ROUND(AVG(up.score), 2) as avg_score
FROM lessons l
JOIN user_progress up ON l.id = up.lesson_id
WHERE up.created_at > NOW() - INTERVAL '30 days'
GROUP BY l.id, l.title
ORDER BY completions DESC
LIMIT 10;
```

---

### Monitoring Checklist (Weekly Review)

- [ ] Review error rate trends (compare to previous week)
- [ ] Check slow query report (any new slow queries?)
- [ ] Review edge function performance (any degradation?)
- [ ] Analyze security logs (any suspicious activity?)
- [ ] Verify backup integrity (test restore on staging)
- [ ] Review rate limit violations (any patterns?)
- [ ] Check database table sizes (growth rate acceptable?)
- [ ] Verify alerting system functional (test alert delivery)

---

**Last Updated:** 2025-11-15  
**Maintainer:** Inner Odyssey DevOps Team  
**Review Frequency:** Monthly
