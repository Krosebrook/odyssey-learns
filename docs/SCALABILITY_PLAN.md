# Scalability Plan
**Project:** Odyssey Learns  
**Date:** 2025-12-29  
**Purpose:** Strategy for scaling to millions of users

## Overview

This document outlines the technical and architectural strategies required to scale Odyssey Learns from thousands to millions of concurrent users while maintaining performance, reliability, and cost-effectiveness.

## Current Architecture Assessment

### Current State
- **Frontend:** React SPA hosted on static hosting
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Users:** Optimized for <10,000 concurrent users
- **Database:** Single PostgreSQL instance
- **Storage:** Supabase Storage (S3-compatible)
- **Deployment:** Single region

### Bottlenecks Identified
1. Database connection pooling limits
2. No CDN for static assets
3. Single region deployment
4. Real-time connections limited
5. No caching layer
6. Monolithic database schema

---

## Scaling Strategy

### Phase 1: Immediate Optimizations (0-50K users)

#### 1.1 Database Optimization

**Connection Pooling**
```typescript
// Implement PgBouncer for connection pooling
// supabase/config/pgbouncer.ini
[databases]
* = host=localhost port=5432 pool_mode=transaction

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
max_client_conn = 10000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 5.0
```

**Query Optimization**
```sql
-- Add missing indexes identified in audit
CREATE INDEX CONCURRENTLY idx_user_progress_child_lesson 
ON user_progress(child_id, lesson_id, status);

CREATE INDEX CONCURRENTLY idx_lessons_grade_active 
ON lessons(grade_level, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_children_parent_active 
ON children(parent_id) WHERE deleted_at IS NULL;

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_progress_completed 
ON user_progress(child_id, completed_at) 
WHERE status = 'completed';

-- Add composite indexes for joins
CREATE INDEX CONCURRENTLY idx_lesson_progress_join
ON user_progress(lesson_id, child_id);
```

**Database Configuration**
```sql
-- Optimize for read-heavy workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
SELECT pg_reload_conf();
```

#### 1.2 CDN Implementation

**Cloudflare Setup**
```typescript
// vite.config.ts - Build for CDN
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
  },
  // Add CDN base URL
  base: process.env.CDN_URL || '/',
});
```

**Cache Headers**
```typescript
// supabase/functions/_shared/headers.ts
export const cacheHeaders = {
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  static: {
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
  },
  dynamic: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  },
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },
};
```

#### 1.3 Redis Caching Layer

```typescript
// src/lib/cache/redis.ts
import { createClient } from 'redis';

export class CacheManager {
  private client: ReturnType<typeof createClient>;

  async initialize() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
      },
    });

    await this.client.connect();
  }

  /**
   * Cache lessons by grade level
   */
  async getLessons(gradeLevel: number): Promise<Lesson[]> {
    const cacheKey = `lessons:grade:${gradeLevel}`;
    
    // Try cache first
    const cached = await this.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('is_active', true);

    // Cache for 1 hour
    await this.client.setEx(cacheKey, 3600, JSON.stringify(data));

    return data || [];
  }

  /**
   * Cache child profile
   */
  async getChild(childId: string): Promise<Child> {
    const cacheKey = `child:${childId}`;
    
    const cached = await this.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    // Cache for 15 minutes
    await this.client.setEx(cacheKey, 900, JSON.stringify(data));

    return data;
  }

  /**
   * Invalidate cache when data changes
   */
  async invalidateLessons(gradeLevel: number): Promise<void> {
    await this.client.del(`lessons:grade:${gradeLevel}`);
  }

  async invalidateChild(childId: string): Promise<void> {
    await this.client.del(`child:${childId}`);
  }
}
```

**Estimated Capacity:** 50,000 concurrent users

---

### Phase 2: Horizontal Scaling (50K-500K users)

#### 2.1 Database Replication

**Read Replicas**
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Primary database (read/write)
export const supabasePrimary = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

// Read replica (read-only)
export const supabaseReplica = createClient(
  process.env.VITE_SUPABASE_REPLICA_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

// Smart router
export function getSupabaseClient(operation: 'read' | 'write') {
  return operation === 'read' ? supabaseReplica : supabasePrimary;
}
```

**Usage Pattern**
```typescript
// Read operations use replica
const { data: lessons } = await getSupabaseClient('read')
  .from('lessons')
  .select('*');

// Write operations use primary
const { data: progress } = await getSupabaseClient('write')
  .from('user_progress')
  .insert({ ... });
```

#### 2.2 Database Sharding by Organization

```sql
-- Shard by parent_id for data isolation
CREATE TABLE lessons_shard_0 (LIKE lessons INCLUDING ALL);
CREATE TABLE lessons_shard_1 (LIKE lessons INCLUDING ALL);
CREATE TABLE lessons_shard_2 (LIKE lessons INCLUDING ALL);
CREATE TABLE lessons_shard_3 (LIKE lessons INCLUDING ALL);

-- Function to determine shard
CREATE OR REPLACE FUNCTION get_shard_id(p_parent_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN abs(hashtext(p_parent_id::text)) % 4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Routing function
CREATE OR REPLACE FUNCTION get_lessons_for_parent(p_parent_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  grade_level INTEGER,
  -- ... other columns
) AS $$
DECLARE
  shard_id INTEGER;
  shard_table TEXT;
BEGIN
  shard_id := get_shard_id(p_parent_id);
  shard_table := 'lessons_shard_' || shard_id;
  
  RETURN QUERY EXECUTE format('SELECT * FROM %I WHERE parent_id = $1', shard_table)
  USING p_parent_id;
END;
$$ LANGUAGE plpgsql;
```

#### 2.3 Microservices Architecture

Split into specialized services:

```typescript
// Architecture diagram
/*
┌─────────────┐
│   React     │
│   Frontend  │
└──────┬──────┘
       │
       ├──────────────────────────┐
       │                          │
┌──────▼──────┐          ┌────────▼────────┐
│   API       │          │  Static Assets  │
│  Gateway    │          │     (CDN)       │
└──────┬──────┘          └─────────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┐
       │          │          │          │          │
┌──────▼─────┐ ┌─▼─────┐ ┌─▼─────┐ ┌─▼─────┐ ┌─▼─────┐
│   Auth     │ │Lesson │ │Progress│ │Gamif. │ │Social │
│  Service   │ │Service│ │Service │ │Service│ │Service│
└────────────┘ └───────┘ └────────┘ └───────┘ └───────┘
       │          │          │          │          │
       └──────────┴──────────┴──────────┴──────────┘
                          │
                   ┌──────▼──────┐
                   │  PostgreSQL  │
                   │  (Sharded)   │
                   └─────────────┘
*/
```

**API Gateway**
```typescript
// services/api-gateway/src/index.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Route to appropriate microservice
app.use('/api/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
}));

app.use('/api/lessons', createProxyMiddleware({
  target: 'http://lesson-service:3002',
  changeOrigin: true,
}));

app.use('/api/progress', createProxyMiddleware({
  target: 'http://progress-service:3003',
  changeOrigin: true,
}));

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.listen(3000);
```

**Lesson Service**
```typescript
// services/lesson-service/src/index.ts
import express from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);

app.get('/lessons/:gradeLevel', async (req, res) => {
  const { gradeLevel } = req.params;
  const cacheKey = `lessons:${gradeLevel}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Query database
  const { rows } = await db.query(
    'SELECT * FROM lessons WHERE grade_level = $1 AND is_active = true',
    [gradeLevel]
  );

  // Cache result
  await redis.setex(cacheKey, 3600, JSON.stringify(rows));

  res.json(rows);
});

app.listen(3002);
```

#### 2.4 Message Queue for Async Operations

```typescript
// src/lib/queue/jobs.ts
import Bull from 'bull';

// Create queues
const lessonGenerationQueue = new Bull('lesson-generation', {
  redis: process.env.REDIS_URL,
});

const emailQueue = new Bull('emails', {
  redis: process.env.REDIS_URL,
});

const analyticsQueue = new Bull('analytics', {
  redis: process.env.REDIS_URL,
});

// Process lesson generation jobs
lessonGenerationQueue.process(async (job) => {
  const { lessonData, userId } = job.data;
  
  // Generate lesson using AI
  const lesson = await generateLessonWithAI(lessonData);
  
  // Save to database
  await saveLessonToDatabase(lesson);
  
  // Notify user
  await emailQueue.add({
    to: userId,
    template: 'lesson-ready',
    data: { lessonId: lesson.id },
  });
  
  return { success: true, lessonId: lesson.id };
});

// Add job to queue
export async function queueLessonGeneration(lessonData: any, userId: string) {
  await lessonGenerationQueue.add(
    { lessonData, userId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}
```

**Estimated Capacity:** 500,000 concurrent users

---

### Phase 3: Global Distribution (500K-5M users)

#### 3.1 Multi-Region Deployment

**Geographic Distribution**
```yaml
# infrastructure/regions.yaml
regions:
  - name: us-east-1
    primary: true
    serves: ["North America"]
  - name: eu-west-1
    serves: ["Europe"]
  - name: ap-southeast-1
    serves: ["Asia Pacific"]
  - name: sa-east-1
    serves: ["South America"]
```

**Region Selection**
```typescript
// src/lib/region/selector.ts
export async function selectOptimalRegion(): Promise<string> {
  // Get user's location
  const userLocation = await getUserLocation();
  
  // Measure latency to each region
  const latencies = await Promise.all(
    REGIONS.map(async (region) => {
      const start = Date.now();
      await fetch(`https://${region}.odyssey-learns.com/ping`);
      const latency = Date.now() - start;
      return { region, latency };
    })
  );

  // Select lowest latency
  const optimal = latencies.reduce((min, curr) => 
    curr.latency < min.latency ? curr : min
  );

  return optimal.region;
}
```

#### 3.2 Global Database with CockroachDB

```sql
-- Migrate to CockroachDB for geo-distribution
-- Automatically replicates data across regions

-- Configure table localities
ALTER TABLE lessons CONFIGURE ZONE USING
  num_replicas = 3,
  constraints = '{"+region=us-east-1": 1, "+region=eu-west-1": 1, "+region=ap-southeast-1": 1}';

-- Pin user data to home region
ALTER TABLE children CONFIGURE ZONE USING
  num_replicas = 3,
  constraints = '{"+region=$user_region": 2}';
```

#### 3.3 Edge Computing with Cloudflare Workers

```typescript
// cloudflare-workers/api-router.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve static content from edge
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    // Cache API responses at edge
    if (url.pathname.startsWith('/api/lessons')) {
      const cache = caches.default;
      let response = await cache.match(request);

      if (!response) {
        response = await fetch(request);
        // Cache for 5 minutes
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 'max-age=300');
        await cache.put(request, response.clone());
      }

      return response;
    }

    // Forward to origin
    return fetch(request);
  },
};
```

**Estimated Capacity:** 5 million concurrent users

---

### Phase 4: Extreme Scale (5M+ users)

#### 4.1 Event-Driven Architecture

```typescript
// src/lib/events/eventBus.ts
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'odyssey-learns',
  brokers: process.env.KAFKA_BROKERS!.split(','),
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'lesson-service' });

// Publish events
export async function publishEvent(topic: string, event: any) {
  await producer.send({
    topic,
    messages: [
      {
        key: event.id,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      },
    ],
  });
}

// Subscribe to events
export async function subscribeToEvents(
  topic: string,
  handler: (event: any) => Promise<void>
) {
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value!.toString());
      await handler(event);
    },
  });
}

// Example: Lesson completed event
await publishEvent('lesson.completed', {
  id: crypto.randomUUID(),
  type: 'lesson.completed',
  childId: 'child-123',
  lessonId: 'lesson-456',
  score: 95,
  timestamp: Date.now(),
});
```

#### 4.2 CQRS Pattern

```typescript
// Command side (writes)
class LessonCommandService {
  async createLesson(command: CreateLessonCommand): Promise<string> {
    // Validate
    this.validate(command);
    
    // Execute command
    const lessonId = await this.saveLessonToWriteDB(command);
    
    // Publish event
    await publishEvent('lesson.created', {
      id: lessonId,
      ...command,
    });
    
    return lessonId;
  }
}

// Query side (reads)
class LessonQueryService {
  async getLessons(query: GetLessonsQuery): Promise<Lesson[]> {
    // Read from optimized read model
    return await this.readFromReadDB(query);
  }
}

// Event handler updates read model
subscribeToEvents('lesson.created', async (event) => {
  // Update read-optimized database
  await updateReadModel(event);
  
  // Update search index
  await updateSearchIndex(event);
  
  // Invalidate caches
  await invalidateCaches(event);
});
```

#### 4.3 Serverless Functions at Scale

```typescript
// Use AWS Lambda / Cloudflare Workers for compute
// Auto-scaling based on demand

// Example: Lesson generation service
export const handler = async (event: any) => {
  const { lessonData } = JSON.parse(event.body);
  
  // Generate lesson
  const lesson = await generateLesson(lessonData);
  
  // Save to DynamoDB for instant availability
  await saveToDynamoDB(lesson);
  
  // Async sync to PostgreSQL
  await queueDatabaseSync(lesson);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ lessonId: lesson.id }),
  };
};
```

#### 4.4 Database Partitioning Strategy

```sql
-- Partition by time for progress data (append-only)
CREATE TABLE user_progress (
  id UUID,
  child_id UUID,
  lesson_id UUID,
  status TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE user_progress_2025_01 PARTITION OF user_progress
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE user_progress_2025_02 PARTITION OF user_progress
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automatic partition management
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
BEGIN
  partition_date := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
  partition_name := 'user_progress_' || to_char(partition_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF user_progress
    FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    partition_date,
    partition_date + INTERVAL '1 month'
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly
SELECT cron.schedule('create-partition', '0 0 1 * *', 'SELECT create_monthly_partition()');
```

**Estimated Capacity:** 10+ million concurrent users

---

## Cost Optimization

### Infrastructure Costs at Scale

| Users | Database | Cache | Storage | CDN | Compute | Total/Month |
|-------|----------|-------|---------|-----|---------|-------------|
| 10K | $200 | $50 | $100 | $50 | $200 | $600 |
| 50K | $500 | $200 | $300 | $200 | $800 | $2,000 |
| 500K | $2K | $800 | $1K | $1K | $5K | $9,800 |
| 5M | $15K | $3K | $5K | $5K | $30K | $58,000 |

### Cost Optimization Strategies

1. **Reserved Instances** - Save 40-60% on compute
2. **Spot Instances** - Use for batch jobs (save 70%)
3. **Auto-scaling** - Scale down during off-peak
4. **Compression** - Reduce storage and bandwidth costs
5. **Smart caching** - Reduce database load
6. **Data archiving** - Move old data to cheaper storage

---

## Monitoring & Observability

### Metrics to Track

```typescript
// src/lib/monitoring/metrics.ts
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-east-1' });

export async function recordMetric(
  name: string,
  value: number,
  unit: 'Count' | 'Milliseconds' | 'Percent' = 'Count'
) {
  await cloudwatch.putMetricData({
    Namespace: 'OdysseyLearns',
    MetricData: [
      {
        MetricName: name,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
  });
}

// Track key metrics
await recordMetric('LessonCompletions', 1);
await recordMetric('APILatency', responseTime, 'Milliseconds');
await recordMetric('CacheHitRate', hitRate, 'Percent');
await recordMetric('DatabaseConnections', activeConnections);
```

### Alerting Rules

```yaml
# alerting/rules.yaml
alerts:
  - name: HighDatabaseLatency
    condition: avg(db_query_duration) > 1000ms
    duration: 5m
    severity: critical
    action: scale_db_replicas

  - name: LowCacheHitRate
    condition: cache_hit_rate < 70%
    duration: 10m
    severity: warning
    action: review_cache_strategy

  - name: HighErrorRate
    condition: error_rate > 1%
    duration: 5m
    severity: critical
    action: rollback_deployment

  - name: CPUUtilization
    condition: cpu_usage > 80%
    duration: 5m
    severity: warning
    action: scale_up_instances
```

---

## Deployment Strategy

### Blue-Green Deployment

```yaml
# infrastructure/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: odyssey-api
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 50%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: odyssey-api
      version: blue
  template:
    metadata:
      labels:
        app: odyssey-api
        version: blue
    spec:
      containers:
      - name: api
        image: odyssey-api:v2.0.0
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Canary Releases

```typescript
// Route 5% of traffic to new version
// Gradually increase if metrics are good

// infrastructure/routing.ts
export const routingRules = {
  canary: {
    enabled: true,
    versions: [
      { version: 'v1.9.0', weight: 95 },
      { version: 'v2.0.0', weight: 5 },
    ],
    metrics: {
      errorRateThreshold: 0.01, // 1%
      latencyThreshold: 500, // ms
    },
    rollback: {
      automatic: true,
      threshold: 0.05, // 5% error rate triggers rollback
    },
  },
};
```

---

## Disaster Recovery

### Backup Strategy

```typescript
// Automated backups
// Daily full backups
// Hourly incremental backups
// 30-day retention

// supabase/backup/schedule.sql
SELECT cron.schedule(
  'full-backup',
  '0 2 * * *', -- 2 AM daily
  $$
    SELECT pg_backup_start('odyssey-full-backup');
    -- Sync to S3
    COPY (SELECT * FROM pg_backup_stop()) TO PROGRAM 'aws s3 cp - s3://odyssey-backups/$(date +%Y%m%d).backup';
  $$
);

SELECT cron.schedule(
  'incremental-backup',
  '0 * * * *', -- Every hour
  $$
    -- Backup WAL files
    SELECT pg_switch_wal();
  $$
);
```

### Recovery Plan

```yaml
# Recovery Time Objective (RTO): 1 hour
# Recovery Point Objective (RPO): 15 minutes

recovery_procedures:
  - scenario: Database failure
    steps:
      - Promote read replica to primary
      - Update DNS to point to new primary
      - Restore from latest backup if needed
    estimated_time: 30 minutes

  - scenario: Region failure
    steps:
      - Activate standby region
      - Route traffic via global load balancer
      - Sync data from backup region
    estimated_time: 45 minutes

  - scenario: Data corruption
    steps:
      - Identify corruption extent
      - Restore from point-in-time backup
      - Replay transaction logs
      - Verify data integrity
    estimated_time: 2 hours
```

---

## Performance Testing

### Load Testing Plan

```typescript
// tests/load/scenario.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 200 }, // Ramp to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 500 }, // Ramp to 500
    { duration: '10m', target: 500 }, // Stay at 500
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% errors
  },
};

export default function () {
  // Login
  const loginRes = http.post(
    'https://api.odyssey-learns.com/auth/login',
    JSON.stringify({
      email: 'test@example.com',
      password: 'test123',
    })
  );
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('access_token');

  // Get lessons
  const lessonsRes = http.get(
    'https://api.odyssey-learns.com/lessons?grade=3',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  check(lessonsRes, {
    'lessons loaded': (r) => r.status === 200,
  });

  // Complete lesson
  const completeRes = http.post(
    'https://api.odyssey-learns.com/progress',
    JSON.stringify({
      lessonId: 'lesson-123',
      score: 95,
    }),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  check(completeRes, {
    'progress saved': (r) => r.status === 200,
  });
}
```

---

## Security at Scale

### DDoS Protection

```typescript
// Cloudflare DDoS protection
// Rate limiting at edge
// Challenge pages for suspicious traffic

// Configure rate limits
const rateLimits = {
  api: {
    requests: 100,
    period: '1m',
    action: 'challenge',
  },
  auth: {
    requests: 5,
    period: '15m',
    action: 'block',
  },
};
```

### Secrets Management

```typescript
// Use AWS Secrets Manager or HashiCorp Vault
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  const response = await secretsManager.getSecretValue({
    SecretId: secretName,
  });

  return response.SecretString!;
}

// Rotate secrets automatically
export async function rotateSecret(secretName: string): Promise<void> {
  await secretsManager.rotateSecret({
    SecretId: secretName,
    RotationRules: {
      AutomaticallyAfterDays: 30,
    },
  });
}
```

---

## Migration Path

### Phase 1 → Phase 2 Migration
1. Set up read replicas
2. Implement caching layer
3. Deploy microservices alongside monolith
4. Gradually route traffic to microservices
5. Sunset monolith

### Phase 2 → Phase 3 Migration
1. Deploy to additional regions
2. Set up global load balancing
3. Migrate to geo-distributed database
4. Enable multi-region writes
5. Test failover scenarios

### Phase 3 → Phase 4 Migration
1. Implement event streaming
2. Migrate to CQRS pattern
3. Deploy serverless functions
4. Partition large tables
5. Optimize based on metrics

---

## Success Metrics

### Performance
- ✅ API latency p95 < 500ms
- ✅ Page load time < 2 seconds
- ✅ Database query time p95 < 100ms
- ✅ Cache hit rate > 80%

### Reliability
- ✅ 99.9% uptime (8.76 hours downtime/year)
- ✅ Zero data loss
- ✅ RTO < 1 hour
- ✅ RPO < 15 minutes

### Scalability
- ✅ Handle 10x traffic spikes
- ✅ Auto-scale within 2 minutes
- ✅ Linear cost scaling

### Cost
- ✅ Cost per active user < $0.10/month
- ✅ Infrastructure efficiency > 70%

---

## Conclusion

This scalability plan provides a clear roadmap from thousands to millions of users. Each phase is designed to be implemented incrementally, minimizing risk while maximizing scalability.

**Key Takeaways:**
- Start with quick wins (caching, CDN, database optimization)
- Scale horizontally before vertically
- Monitor everything, optimize based on data
- Plan for failure, test disaster recovery
- Keep costs in check with smart architecture

**Timeline:**
- Phase 1: 1-2 months
- Phase 2: 3-4 months
- Phase 3: 4-6 months
- Phase 4: 6-12 months

**Total Investment:** ~18-24 months to full global scale
**Expected Outcome:** Platform capable of serving 10+ million users with excellent performance and reliability
