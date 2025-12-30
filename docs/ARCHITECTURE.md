# Odyssey Learns - System Architecture

> **Detailed technical architecture and design decisions**

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Security Architecture](#security-architecture)
6. [Data Flow](#data-flow)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability Considerations](#scalability-considerations)

---

## 🏗️ Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │    Mobile    │  │    Tablet    │     │
│  │  (React App) │  │     (PWA)    │  │     (PWA)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTPS/WebSocket
                             │
┌────────────────────────────┼────────────────────────────────┐
│                   Application Layer                          │
│                             │                                │
│  ┌────────────────────────┬┴──────────────────────┐        │
│  │   React Application    │   Supabase Client     │        │
│  │  ┌──────────────────┐  │  ┌──────────────────┐ │        │
│  │  │ Component Tree   │  │  │  Auth Service    │ │        │
│  │  │ React Router     │  │  │  Database Client │ │        │
│  │  │ React Query      │  │  │  Storage Client  │ │        │
│  │  │ Context/State    │  │  │  Realtime Sub    │ │        │
│  │  └──────────────────┘  │  └──────────────────┘ │        │
│  └────────────────────────┴───────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     Backend Layer (Supabase)                 │
│                             │                                │
│  ┌─────────────┐  ┌────────┴────────┐  ┌──────────────┐   │
│  │   Auth      │  │   PostgreSQL    │  │   Storage    │   │
│  │  (JWT)      │  │   (with RLS)    │  │   (S3-like)  │   │
│  └─────────────┘  └─────────────────┘  └──────────────┘   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Edge Functions  │  │   Realtime       │               │
│  │  (Serverless)    │  │   (WebSocket)    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│              External Services Layer                         │
│                             │                                │
│  ┌────────────┐  ┌────────┴─────┐  ┌─────────────┐        │
│  │ Claude AI  │  │  Gemini AI   │  │  Analytics  │        │
│  └────────────┘  └──────────────┘  └─────────────┘        │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │   Email    │  │    CDN       │  │  Monitoring │        │
│  └────────────┘  └──────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Component Architecture

```
src/
├── App.tsx                    # Root component with routing
├── main.tsx                   # Application entry point
│
├── pages/                     # Route-level components
│   ├── Landing.tsx           # Marketing page
│   ├── Login.tsx             # Authentication
│   ├── ParentDashboard.tsx   # Parent view
│   ├── ChildDashboard.tsx    # Child view
│   └── [30+ more pages]
│
├── components/               # Reusable components
│   ├── ui/                   # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── [50+ components]
│   │
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── learning/            # Learning-specific
│   │   ├── LessonCard.tsx
│   │   ├── LessonPlayer.tsx
│   │   ├── QuizQuestion.tsx
│   │   └── ProgressBar.tsx
│   │
│   └── [feature folders]    # Organized by domain
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.tsx          # Authentication state
│   ├── useChild.tsx         # Child data fetching
│   ├── useLessons.tsx       # Lesson queries
│   └── [more hooks]
│
├── lib/                      # Utilities and helpers
│   ├── api/                 # API functions
│   │   ├── children.ts
│   │   ├── lessons.ts
│   │   └── [more APIs]
│   │
│   ├── schemas/             # Zod validation schemas
│   ├── analytics.ts         # Analytics tracking
│   ├── inputSanitization.ts # Security utilities
│   └── utils.ts             # General utilities
│
└── integrations/            # External integrations
    └── supabase/
        ├── client.ts        # Supabase instance
        └── types.ts         # Generated types
```

### State Management Strategy

**1. Server State (React Query)**
```typescript
// Fetching and caching server data
const { data: lessons, isLoading } = useQuery({
  queryKey: ['lessons', gradeLevel],
  queryFn: () => fetchLessons(gradeLevel),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**2. Client State (React Context)**
```typescript
// Global client-side state
const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});
```

**3. URL State (React Router)**
```typescript
// State derived from URL
const { id } = useParams<{ id: string }>();
const [searchParams] = useSearchParams();
const filter = searchParams.get('filter');
```

**4. Form State (React Hook Form)**
```typescript
// Form-specific state
const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Component Patterns

**1. Container/Presentational Pattern**
```typescript
// Container (logic)
export function LessonListContainer() {
  const { data, loading } = useLessons();
  const handleStart = (id: string) => navigate(`/lessons/${id}`);
  
  return <LessonList lessons={data} onStart={handleStart} loading={loading} />;
}

// Presentational (UI)
export function LessonList({ lessons, onStart, loading }: Props) {
  if (loading) return <LoadingState />;
  return <div>{lessons.map(l => <LessonCard lesson={l} onStart={onStart} />)}</div>;
}
```

**2. Compound Components**
```typescript
// Flexible composition
<Card>
  <Card.Header>
    <Card.Title>Lesson Title</Card.Title>
  </Card.Header>
  <Card.Content>
    Content goes here
  </Card.Content>
  <Card.Footer>
    <Button>Start</Button>
  </Card.Footer>
</Card>
```

**3. Render Props**
```typescript
// Flexible rendering
<DataFetcher
  fetch={fetchLessons}
  render={(data, loading) => (
    loading ? <Loading /> : <LessonGrid lessons={data} />
  )}
/>
```

---

## ⚙️ Backend Architecture

### Supabase Backend-as-a-Service

**Services Used:**
1. **PostgreSQL Database** - All application data
2. **Authentication** - User management with JWT
3. **Storage** - File uploads (avatars, thumbnails)
4. **Realtime** - WebSocket subscriptions
5. **Edge Functions** - Serverless compute

### API Layer

**RESTful Patterns:**
```typescript
// CRUD operations via Supabase client
const api = {
  // Read
  getById: (id: string) => supabase.from('table').select().eq('id', id).single(),
  getAll: () => supabase.from('table').select(),
  
  // Create
  create: (data: NewRecord) => supabase.from('table').insert(data).select().single(),
  
  // Update
  update: (id: string, data: Updates) => supabase.from('table').update(data).eq('id', id),
  
  // Delete (soft delete preferred)
  delete: (id: string) => supabase.from('table').update({ is_active: false }).eq('id', id),
};
```

**Realtime Subscriptions:**
```typescript
// Listen to database changes
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handleNewNotification)
  .subscribe();
```

### Edge Functions

**Use Cases:**
1. **AI Integration** - Call Claude/Gemini APIs
2. **Server-side Validation** - Validate complex business logic
3. **Third-party APIs** - Integrate external services
4. **Scheduled Tasks** - Cron jobs (generate quests, cleanup)
5. **Webhooks** - Handle external events

**Example Structure:**
```typescript
// supabase/functions/generate-lesson/index.ts
Deno.serve(async (req) => {
  // 1. Authenticate
  const token = req.headers.get('Authorization');
  const user = await verifyToken(token);
  
  // 2. Validate input
  const body = await req.json();
  const validated = validateInput(body);
  
  // 3. Business logic
  const result = await generateLesson(validated);
  
  // 4. Return response
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 💾 Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│   profiles  │ (auth.users extension)
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│  children   │    │   rewards    │
└──────┬──────┘    └──────┬───────┘
       │                  │
       │                  │
       ├────────┬─────────┼────────┐
       │        │         │        │
       ▼        ▼         ▼        ▼
┌──────────┐ ┌─────┐ ┌──────┐ ┌────────────┐
│ progress │ │quests│ │badges│ │redemptions │
└──────────┘ └─────┘ └──────┘ └────────────┘
       │
       │
       ▼
┌─────────────┐
│   lessons   │ (platform content)
└─────────────┘
       │
       ├────────────┬──────────────┐
       │            │              │
       ▼            ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│  shares  │ │ collab   │ │ screen_time  │
└──────────┘ └──────────┘ └──────────────┘
```

### Key Tables

**1. profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE
);
```

**2. children**
```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level INTEGER CHECK (grade_level >= 0 AND grade_level <= 12),
  avatar_config JSONB,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. lessons**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level INTEGER NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_markdown TEXT NOT NULL,
  quiz_questions JSONB,
  estimated_minutes INTEGER,
  points_value INTEGER DEFAULT 50,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. user_progress**
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, lesson_id)
);
```

### Indexing Strategy

```sql
-- Frequently queried columns
CREATE INDEX idx_lessons_grade_subject ON lessons(grade_level, subject, is_active);
CREATE INDEX idx_progress_child ON user_progress(child_id, status);
CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_quests_child_expires ON daily_quests(child_id, expires_at);

-- Full-text search
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('english', title));
CREATE INDEX idx_lessons_content_search ON lessons USING gin(to_tsvector('english', content_markdown));
```

### Row-Level Security (RLS)

**Example Policy:**
```sql
-- Children can only see their own data
CREATE POLICY "Children see own data"
ON children
FOR SELECT
USING (
  id = auth.uid() OR
  parent_id = auth.uid()
);

-- Parents can only update their own children
CREATE POLICY "Parents update own children"
ON children
FOR UPDATE
USING (parent_id = auth.uid());

-- Lessons visible to appropriate grade levels
CREATE POLICY "Lessons by grade access"
ON lessons
FOR SELECT
USING (
  is_active = TRUE AND
  grade_level IN (
    SELECT grade_level FROM children WHERE id = auth.uid()
  )
);
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User enters credentials
        ↓
2. Supabase Auth validates
        ↓
3. JWT token issued
        ↓
4. Token stored in localStorage
        ↓
5. Token included in all requests
        ↓
6. Supabase validates token
        ↓
7. RLS policies enforced
        ↓
8. Data returned/modified
```

### Security Layers

**1. Transport Security**
- HTTPS/TLS 1.3 for all connections
- Secure WebSocket (WSS) for realtime
- HSTS headers enabled

**2. Authentication Security**
- JWT tokens with short expiration (1 hour)
- Refresh token rotation
- Secure password hashing (bcrypt)
- Multi-factor authentication (planned)
- Session management

**3. Authorization Security**
- Row-Level Security (RLS) on all tables
- Role-based access control (RBAC)
- API-level permission checks
- Rate limiting

**4. Input Validation**
- Client-side: Zod schemas
- Server-side: Edge function validation
- SQL injection prevention (parameterized queries)
- XSS prevention (DOMPurify)

**5. Data Protection**
- Encryption at rest
- Encryption in transit
- PII minimization
- Data anonymization for analytics

---

## 🔄 Data Flow

### Lesson Completion Flow

```
1. Child clicks "Complete Lesson"
        ↓
2. Frontend validates quiz answers
        ↓
3. Calculate score and time spent
        ↓
4. Call API: completeLesson()
        ↓
5. Update user_progress (status, score, completed_at)
        ↓
6. Award points to child
        ↓
7. Check and award badges (BadgeChecker)
        ↓
8. Update streak (if applicable)
        ↓
9. Check quest progress (QuestGenerator)
        ↓
10. Create celebration animation
        ↓
11. Send notification to parent
        ↓
12. Update local cache (React Query)
        ↓
13. Display success message
```

### Real-time Notification Flow

```
Parent approves reward
        ↓
INSERT into reward_redemptions (status='approved')
        ↓
Database trigger fires
        ↓
Supabase Realtime broadcasts change
        ↓
Child's browser receives WebSocket message
        ↓
React Query cache updated
        ↓
UI updates automatically
        ↓
Notification toast shown
```

---

## 🌐 Deployment Architecture

### Production Environment

```
┌────────────────────────────────────────┐
│            Cloudflare CDN              │
│    (Static assets, DDoS protection)    │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│            Vercel Edge Network         │
│         (React App Hosting)            │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│         Supabase Platform              │
│  ┌──────────────────────────────────┐ │
│  │   Database (PostgreSQL)          │ │
│  │   - Primary (write)              │ │
│  │   - Read replicas (planned)      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │   Edge Functions (Deno)          │ │
│  │   - AI integration               │ │
│  │   - Webhooks                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │   Storage (S3-compatible)        │ │
│  │   - Avatars                      │ │
│  │   - Lesson thumbnails            │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### CI/CD Pipeline

```
1. Developer pushes code
        ↓
2. GitHub Actions triggered
        ↓
3. Run tests (unit, integration)
        ↓
4. Run linting (ESLint, TypeScript)
        ↓
5. Build production bundle
        ↓
6. Deploy to staging (Vercel preview)
        ↓
7. Run E2E tests (Playwright)
        ↓
8. Manual approval
        ↓
9. Deploy to production (Vercel)
        ↓
10. Health checks
        ↓
11. Notify team (Slack)
```

---

## 📈 Scalability Considerations

### Current Capacity
- **Users**: ~1,000 concurrent
- **Lessons**: ~10,000 platform lessons
- **API calls**: ~100 req/sec
- **Database**: ~1GB data

### Scaling Strategy

**Horizontal Scaling:**
- **Frontend**: Automatic (Vercel serverless)
- **Database**: Read replicas for queries
- **Edge Functions**: Auto-scaling by Supabase
- **Storage**: CDN for static assets

**Vertical Scaling:**
- **Database**: Upgrade instance size
- **Connection pooling**: PgBouncer
- **Caching**: Redis for session data

**Optimization:**
- **Code splitting**: Lazy load routes
- **Image optimization**: WebP, lazy loading
- **Query optimization**: Proper indexes
- **Caching**: React Query + CDN

### Monitoring

**Metrics Tracked:**
- Request latency (p50, p95, p99)
- Error rates
- Database query performance
- Cache hit rates
- User engagement metrics
- Business metrics (conversions, churn)

**Tools:**
- **Frontend**: Vercel Analytics
- **Backend**: Supabase Dashboard
- **Errors**: Sentry
- **Uptime**: UptimeRobot
- **Performance**: Lighthouse CI

---

## 🎯 Design Decisions

### Why Supabase?
✅ Rapid development (BaaS)  
✅ PostgreSQL (proven, reliable)  
✅ Built-in auth and storage  
✅ Real-time subscriptions  
✅ Generous free tier  
✅ Easy to self-host if needed

### Why React Query?
✅ Excellent caching  
✅ Automatic refetching  
✅ Optimistic updates  
✅ Error handling  
✅ Dev tools

### Why shadcn/ui?
✅ Accessible (Radix UI)  
✅ Customizable  
✅ TypeScript support  
✅ No runtime dependency  
✅ Beautiful design

### Why Vite?
✅ Fast dev server (HMR)  
✅ Optimized builds  
✅ Modern tooling  
✅ Plugin ecosystem  
✅ TypeScript first-class

---

## 🔮 Future Architecture

### Microservices (V2.0+)
```
Monolith (current)
    ↓
API Gateway
    ├── Auth Service
    ├── Lesson Service
    ├── Analytics Service
    ├── Notification Service
    └── AI Service
```

### Event-Driven Architecture
```
Event Bus (Kafka/RabbitMQ)
    ├── Lesson.Completed
    ├── Badge.Earned
    ├── Quest.Generated
    └── Reward.Requested
```

---

**Last Updated**: 2025-12-30
