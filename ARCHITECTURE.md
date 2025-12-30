# Architecture Documentation

**Project**: Odyssey Learns  
**Version**: 0.3.0  
**Last Updated**: 2024-12-30

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Considerations](#scalability-considerations)
8. [Technology Decisions](#technology-decisions)

---

## System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Application (Vite + TypeScript)     │   │
│  │                                                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐│   │
│  │  │   Pages     │  │  Components  │  │   Hooks  ││   │
│  │  └─────────────┘  └──────────────┘  └──────────┘│   │
│  │                                                    │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │        State Management Layer                │ │   │
│  │  │  - React Query (Server State)                │ │   │
│  │  │  - React Context (Auth, Global State)        │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    Supabase Platform                      │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │
│  │    Auth    │  │ PostgREST│  │ Storage │  │Realtime│ │
│  └────────────┘  └──────────┘  └─────────┘  └────────┘ │
│                            │                              │
│                            ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │          PostgreSQL Database                      │   │
│  │  - Row-Level Security (RLS)                       │   │
│  │  - Foreign Key Constraints                        │   │
│  │  - Indexes and Optimizations                      │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### System Components

1. **Client Application**: React SPA with TypeScript
2. **API Layer**: Supabase auto-generated REST API
3. **Database**: PostgreSQL with RLS
4. **Authentication**: Supabase Auth
5. **Storage**: Supabase Storage for media files
6. **Real-time**: Supabase Realtime for live updates

---

## Architecture Patterns

### 1. Feature-Based Organization

Components are organized by feature domain rather than technical function:

```
components/
├── admin/         # Admin-specific features
├── auth/          # Authentication flows
├── avatar/        # Avatar customization
├── badges/        # Achievement system
├── gamification/  # Points, rewards, tokens
├── learning/      # Core learning features
├── parent/        # Parent dashboard
└── ui/            # Reusable UI primitives
```

**Benefits:**
- Clear separation of concerns
- Easy to locate feature-related code
- Facilitates team collaboration
- Supports incremental refactoring

### 2. Container/Presentational Pattern

**Container Components** (Smart):
- Connect to data sources (React Query)
- Handle business logic
- Manage local state
- Pass data to presentational components

**Presentational Components** (Dumb):
- Receive data via props
- Focus on rendering UI
- Minimal or no state
- Highly reusable

Example:
```typescript
// Container Component
export function LessonListContainer() {
  const { data: lessons, isLoading } = useLessons(gradeLevel);
  
  if (isLoading) return <LoadingSpinner />;
  
  return <LessonList lessons={lessons} />;
}

// Presentational Component
interface LessonListProps {
  lessons: Lesson[];
}

export function LessonList({ lessons }: LessonListProps) {
  return (
    <div>
      {lessons.map(lesson => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}
```

### 3. Custom Hooks for Business Logic

Reusable logic is extracted into custom hooks:

```typescript
// hooks/useAuth.tsx
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Authentication logic
  
  return { user, loading, login, logout, signup };
}

// hooks/useLessons.ts
export function useLessons(gradeLevel: number) {
  return useQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: () => fetchLessons(gradeLevel),
  });
}
```

### 4. Dependency Injection Pattern

Services and utilities are injected rather than directly imported:

```typescript
// lib/lessonService.ts
export const lessonService = {
  async getLessons(gradeLevel: number) {
    // Implementation
  },
  async getLesson(id: string) {
    // Implementation
  },
};

// Component usage
import { lessonService } from '@/lib/lessonService';

function Component() {
  const fetchData = () => lessonService.getLessons(grade);
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Router, Providers)
├── AuthProvider (Authentication Context)
│   ├── Landing Page
│   ├── Auth Pages (Login, Signup)
│   ├── Parent Dashboard
│   │   ├── ChildOverview
│   │   ├── LessonAssignment
│   │   ├── RewardManagement
│   │   └── ProgressTracking
│   ├── Child Dashboard
│   │   ├── CurrentProgress
│   │   ├── AvailableLessons
│   │   ├── BadgesDisplay
│   │   └── DailyQuests
│   ├── Lesson Pages
│   │   ├── LessonList
│   │   ├── LessonDetail
│   │   └── LessonPlayer
│   └── Settings & Profile
└── Global Components (Toast, Tooltip)
```

### State Management Strategy

#### Server State (React Query)

All data from Supabase is managed by React Query:

```typescript
// Fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['lessons', gradeLevel],
  queryFn: () => getLessons(gradeLevel),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations
const mutation = useMutation({
  mutationFn: createLesson,
  onSuccess: () => {
    queryClient.invalidateQueries(['lessons']);
  },
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

#### Client State (React Context)

Global client state uses React Context:

```typescript
// Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
const { user } = useAuth();
```

#### Local State (useState, useReducer)

Component-specific state uses React hooks:

```typescript
function Component() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(initialData);
  
  // Component logic
}
```

### Routing Strategy

React Router v6 with declarative routes:

```typescript
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  
  {/* Protected Routes */}
  <Route path="/parent-dashboard" element={<ParentDashboard />} />
  <Route path="/dashboard" element={<ChildDashboard />} />
  
  {/* Dynamic Routes */}
  <Route path="/lessons/:id" element={<LessonPlayer />} />
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Route Protection:**
- Auth checks in route components
- Redirect to login if not authenticated
- Role-based access control (parent vs. child)

### Form Management

React Hook Form + Zod validation:

```typescript
const schema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  grade_level: z.number().int().min(0).max(12),
});

type FormData = z.infer<typeof schema>;

function LessonForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = async (data: FormData) => {
    await createLesson(data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Backend Architecture

### Database Schema Design

#### Core Principles

1. **Normalization**: Avoid data duplication
2. **Foreign Keys**: Enforce referential integrity
3. **Constraints**: Validate data at database level
4. **Indexes**: Optimize query performance

#### Key Tables

**Users and Profiles:**
```sql
-- Extended from auth.users
profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL, -- 'parent' or 'child'
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)

children (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  grade_level INTEGER CHECK (0-12),
  avatar_config JSONB,
  total_points INTEGER DEFAULT 0,
  pin_hash TEXT,
  created_at TIMESTAMPTZ
)
```

**Learning Content:**
```sql
lessons (
  id UUID PRIMARY KEY,
  grade_level INTEGER CHECK (0-12),
  subject TEXT CHECK (IN subjects),
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  estimated_minutes INTEGER,
  points_value INTEGER,
  quiz_questions JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)

user_progress (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  lesson_id UUID REFERENCES lessons(id),
  status TEXT CHECK (IN statuses),
  score INTEGER CHECK (0-100),
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE(child_id, lesson_id)
)
```

**Gamification:**
```sql
achievement_badges (
  id UUID PRIMARY KEY,
  badge_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlock_criteria JSONB,
  points_reward INTEGER,
  tier TEXT,
  is_active BOOLEAN
)

user_badges (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  badge_id UUID REFERENCES achievement_badges(id),
  earned_at TIMESTAMPTZ,
  UNIQUE(child_id, badge_id)
)

daily_quests (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  quest_type TEXT,
  target_value INTEGER,
  current_progress INTEGER,
  points_reward INTEGER,
  status TEXT,
  date DATE,
  UNIQUE(child_id, date)
)
```

**Rewards:**
```sql
rewards (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)

reward_redemptions (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  reward_id UUID REFERENCES rewards(id),
  status TEXT CHECK (IN statuses),
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
)
```

### Row-Level Security (RLS)

All tables have RLS enabled with strict policies:

**Example: Children Table**
```sql
-- Parents can view their own children
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can manage their own children
CREATE POLICY "Parents can manage own children"
  ON children FOR ALL
  USING (auth.uid() = parent_id);
```

**Example: User Progress**
```sql
-- Parents can view their children's progress
CREATE POLICY "Parents can view children progress"
  ON user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = user_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );
```

### API Design

#### Supabase Client Usage

```typescript
// Read
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('grade_level', gradeLevel)
  .eq('is_active', true)
  .order('created_at', { ascending: false });

// Create
const { data, error } = await supabase
  .from('user_progress')
  .insert({
    child_id: childId,
    lesson_id: lessonId,
    status: 'in_progress',
  });

// Update
const { data, error } = await supabase
  .from('children')
  .update({ total_points: newPoints })
  .eq('id', childId);

// Delete
const { error } = await supabase
  .from('rewards')
  .delete()
  .eq('id', rewardId);
```

#### Real-time Subscriptions

```typescript
// Subscribe to notifications
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New notification:', payload.new);
      showToast(payload.new.message);
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

---

## Data Flow

### Lesson Completion Flow

```
1. Child selects lesson
   └─> LessonPlayer component mounts
   
2. Fetch lesson content
   └─> React Query: useQuery(['lesson', id])
   └─> Supabase: SELECT * FROM lessons WHERE id = ?
   
3. Render lesson with markdown
   └─> ReactMarkdown + sanitization
   
4. Child completes lesson
   └─> Submit quiz answers
   
5. Calculate score
   └─> Client-side calculation
   
6. Update progress
   └─> React Query: useMutation(updateProgress)
   └─> Supabase: INSERT/UPDATE user_progress
   
7. Award points
   └─> Supabase: UPDATE children SET total_points = total_points + ?
   
8. Check for badge unlocks
   └─> badgeChecker utility
   └─> Insert into user_badges if criteria met
   
9. Show celebration
   └─> CelebrationAnimation component
   └─> Confetti effect
   
10. Update UI
    └─> React Query invalidates ['progress', 'badges']
    └─> UI re-renders with new data
```

### Reward Redemption Flow

```
1. Child browses available rewards
   └─> Filtered by points_cost <= child's total_points
   
2. Child requests reward
   └─> Create reward_redemption (status: 'pending')
   └─> Create notification for parent
   
3. Parent receives notification
   └─> Real-time subscription triggers
   └─> Toast notification appears
   
4. Parent reviews request
   └─> View child's points balance
   └─> View reward details
   
5. Parent approves/denies
   └─> Update reward_redemption status
   └─> If approved: Deduct points from child
   └─> Create notification for child
   
6. Child sees result
   └─> Notification appears
   └─> Points updated in dashboard
```

---

## Security Architecture

### Defense in Depth

Multiple layers of security:

```
┌─────────────────────────────────────────┐
│  1. Client-Side Validation               │
│     - Zod schemas                        │
│     - Input sanitization                 │
│     - Rate limiting                      │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  2. Network Security                     │
│     - HTTPS only                         │
│     - CORS configuration                 │
│     - CSP headers                        │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  3. Authentication                       │
│     - Supabase Auth                      │
│     - JWT tokens                         │
│     - Session management                 │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  4. Authorization                        │
│     - Row-Level Security (RLS)           │
│     - Role-based access                  │
│     - Policy enforcement                 │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  5. Data Protection                      │
│     - Parameterized queries              │
│     - XSS prevention (DOMPurify)         │
│     - SQL injection prevention           │
└─────────────────────────────────────────┘
```

### Input Sanitization

```typescript
// lib/inputSanitization.ts
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .substring(0, 5000); // Limit length
}

export function sanitizeMarkdown(markdown: string): string {
  // Use rehype-sanitize in markdown rendering
  return markdown;
}

// Usage
const sanitizedTitle = sanitizeText(userInput.title);
```

### Rate Limiting

```typescript
// lib/rateLimiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

// Usage
const limiter = new RateLimiter();
if (!limiter.isAllowed(`lesson-complete-${childId}`, 10, 60000)) {
  throw new Error('Rate limit exceeded');
}
```

---

## Scalability Considerations

### Current Limitations

1. **Client-Side Rendering**: No SSR/SSG
2. **Single Region**: No multi-region support
3. **No Caching Layer**: Redis or CDN
4. **No Load Balancing**: Single Supabase instance
5. **No CDN**: Static assets served from origin

### Scaling Strategies

#### Horizontal Scaling

**Phase 1: CDN Integration**
```
- Deploy to Vercel/Netlify with CDN
- Cache static assets
- Edge functions for API routes
```

**Phase 2: Database Scaling**
```
- Read replicas for heavy read operations
- Connection pooling (PgBouncer)
- Partitioning large tables (user_progress, security_logs)
```

**Phase 3: Caching Layer**
```
- Redis for session caching
- Cache frequently accessed lessons
- Cache user profiles and badges
```

#### Vertical Scaling

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Optimize slow queries
   - Archive old data

2. **Code Splitting**
   - Lazy load routes
   - Dynamic imports for heavy components
   - Tree shaking unused code

3. **Asset Optimization**
   - Image compression and WebP
   - Code minification
   - Gzip compression

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Time to First Byte (TTFB) | < 200ms | TBD |
| First Contentful Paint (FCP) | < 1.5s | TBD |
| Largest Contentful Paint (LCP) | < 2.5s | TBD |
| Time to Interactive (TTI) | < 3.5s | TBD |
| Bundle Size | < 500KB | TBD |

---

## Technology Decisions

### Why React?

**Pros:**
- Large ecosystem and community
- Mature tooling and libraries
- Great developer experience
- Strong TypeScript support
- Component-based architecture

**Cons:**
- Larger bundle size than alternatives
- No built-in SSR (requires Next.js)
- Learning curve for beginners

### Why Vite?

**Pros:**
- Lightning-fast HMR
- Optimized production builds
- Modern ESM-based
- Plugin ecosystem
- TypeScript out of the box

**Cons:**
- Newer than webpack (less mature)
- Limited SSR support

### Why Supabase?

**Pros:**
- Open-source Firebase alternative
- PostgreSQL (powerful and reliable)
- Built-in RLS for security
- Real-time capabilities
- Generous free tier
- Easy to migrate away (standard Postgres)

**Cons:**
- Vendor lock-in (partially)
- Learning curve for RLS
- Limited regional availability

### Why React Query?

**Pros:**
- Simplifies server state management
- Automatic caching and refetching
- Optimistic updates
- Request deduplication
- DevTools for debugging

**Cons:**
- Additional dependency
- Learning curve
- Opinionated patterns

### Why shadcn/ui?

**Pros:**
- Copy-paste components (not dependency)
- Full customization control
- Built on Radix UI (accessible)
- Tailwind CSS integration
- Active development

**Cons:**
- Manual updates needed
- More setup than component library
- Requires Tailwind knowledge

---

## Future Architectural Improvements

### Short Term (1-3 months)

1. **Add Testing Infrastructure**
   - Unit tests with Vitest
   - Component tests with React Testing Library
   - E2E tests with Playwright

2. **Implement Code Splitting**
   - Route-based lazy loading
   - Dynamic imports for heavy components

3. **Add Error Boundaries**
   - Global error boundary
   - Feature-specific boundaries
   - Error reporting service

4. **Optimize Bundle Size**
   - Tree shaking
   - Dynamic imports
   - Remove unused dependencies

### Medium Term (3-6 months)

1. **Implement SSR/SSG**
   - Migrate to Next.js for SSR
   - Or implement custom SSR solution
   - Improve SEO and performance

2. **Add Caching Layer**
   - Redis for session caching
   - CDN for static assets
   - Cache invalidation strategy

3. **Microservices Architecture**
   - Supabase Edge Functions for complex logic
   - Separate services for heavy processing
   - Message queue for async tasks

4. **Advanced Monitoring**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Analytics integration

### Long Term (6-12 months)

1. **Multi-Region Support**
   - Deploy to multiple regions
   - Geo-routing for performance
   - Data replication strategy

2. **Mobile Applications**
   - React Native app
   - Shared business logic
   - Offline support

3. **Advanced AI Features**
   - Personalized lesson recommendations
   - Adaptive learning paths
   - AI-powered content generation

4. **Scalability Infrastructure**
   - Kubernetes for orchestration
   - Auto-scaling based on load
   - Advanced load balancing

---

**Document Version**: 1.0  
**Last Reviewed**: 2024-12-30  
**Next Review**: 2025-03-30
