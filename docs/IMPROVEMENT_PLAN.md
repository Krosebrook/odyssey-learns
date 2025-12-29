# Improvement Plan
**Project:** Odyssey Learns  
**Date:** 2025-12-29  
**Scope:** General quality and feature improvements

## Overview

This document outlines general improvements to enhance user experience, code quality, performance, security, and maintainability beyond the core refactoring work.

## Priority Matrix

| Priority | Timeline | Focus |
|----------|----------|-------|
| P0 (Critical) | Week 1-2 | Security & Critical Bugs |
| P1 (High) | Week 3-6 | User Experience & Performance |
| P2 (Medium) | Week 7-12 | Nice-to-have Features |
| P3 (Low) | Month 4+ | Future Enhancements |

---

## 1. Security Improvements

### Priority: P0 (Critical) 🔴

#### 1.1 Fix NPM Security Vulnerabilities
**Impact:** High | **Effort:** Low

**Current Issues:**
- 5 vulnerabilities (4 moderate, 1 high)
- esbuild, glob, js-yaml, mdast-util-to-hast

**Actions:**
```bash
# Update dependencies
npm audit fix

# If auto-fix doesn't work, manually update:
npm update esbuild
npm update glob
npm update js-yaml
npm update mdast-util-to-hast

# Verify fixes
npm audit
```

#### 1.2 Implement Content Security Policy (CSP)
**Impact:** High | **Effort:** Medium

```typescript
// Add to index.html or via meta tag
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://apis.google.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://*.supabase.co;
        frame-src 'none';
      ">
```

#### 1.3 Server-Side Validation
**Impact:** High | **Effort:** Medium

**Current:** Client-side validation only  
**Needed:** Supabase Edge Functions for validation

```typescript
// supabase/functions/validate-lesson-creation/index.ts
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const LessonSchema = z.object({
  title: z.string().min(3).max(200),
  content_markdown: z.string().min(10).max(50000),
  grade_level: z.number().min(0).max(12),
  subject: z.enum(['reading', 'math', 'science', 'social', 'lifeskills']),
});

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const validated = LessonSchema.parse(body);
    
    // Additional business logic validation
    // Save to database
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 1.4 Rate Limiting (Server-Side)
**Impact:** High | **Effort:** Medium

```sql
-- Add rate limiting table
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Get or create rate limit record
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM api_rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint
  FOR UPDATE;

  -- If no record or window expired, reset
  IF NOT FOUND OR (NOW() - v_window_start) > (p_window_minutes || ' minutes')::INTERVAL THEN
    INSERT INTO api_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW())
    ON CONFLICT (user_id, endpoint) DO UPDATE
    SET request_count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;

  -- Check limit
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment count
  UPDATE api_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### 1.5 Input Validation Improvements
**Impact:** Medium | **Effort:** Low

Enhance existing sanitization:

```typescript
// src/lib/inputSanitization.ts - Add more validators

/**
 * Validate and sanitize grade level
 */
export const validateGradeLevel = (grade: unknown): number => {
  const num = Number(grade);
  if (isNaN(num) || num < 0 || num > 12) {
    throw new Error('Invalid grade level. Must be 0-12.');
  }
  return num;
};

/**
 * Validate lesson subject
 */
export const validateSubject = (subject: string): string => {
  const validSubjects = ['reading', 'math', 'science', 'social', 'lifeskills'];
  if (!validSubjects.includes(subject)) {
    throw new Error(`Invalid subject. Must be one of: ${validSubjects.join(', ')}`);
  }
  return subject;
};

/**
 * Sanitize and validate username
 */
export const validateUsername = (username: string): string => {
  const sanitized = username.trim().toLowerCase();
  
  // Only alphanumeric and underscore
  if (!/^[a-z0-9_]{3,20}$/.test(sanitized)) {
    throw new Error('Username must be 3-20 characters, alphanumeric and underscore only');
  }
  
  // No offensive words
  const blocklist = ['admin', 'root', 'system']; // Expand as needed
  if (blocklist.some(word => sanitized.includes(word))) {
    throw new Error('Username not allowed');
  }
  
  return sanitized;
};
```

---

## 2. User Experience Improvements

### Priority: P1 (High) 🟡

#### 2.1 Improved Loading States
**Impact:** High | **Effort:** Low

Add skeleton loaders instead of spinners:

```typescript
// src/components/ui/skeleton.tsx
export function LessonCardSkeleton() {
  return (
    <Card>
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded-t" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </Card>
  );
}

// Usage
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    <LessonCardSkeleton />
    <LessonCardSkeleton />
    <LessonCardSkeleton />
  </div>
) : (
  <LessonGrid lessons={lessons} />
)}
```

#### 2.2 Better Empty States
**Impact:** Medium | **Effort:** Low

```typescript
// src/components/ui/empty-states.tsx
export function NoLessonsYet() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <BookOpen className="w-24 h-24 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Start your learning journey by browsing our available lessons or ask your parent to create custom lessons for you!
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/lessons')}>
          Browse Lessons
        </Button>
        <Button variant="outline" onClick={() => navigate('/custom-lesson')}>
          Request Custom Lesson
        </Button>
      </div>
    </div>
  );
}
```

#### 2.3 Onboarding Tour Improvements
**Impact:** High | **Effort:** Medium

Enhance the existing onboarding:

```typescript
// src/components/onboarding/InteractiveTour.tsx
import { Shepherd } from 'react-shepherd';

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Odyssey Learns!',
    text: 'Let me show you around',
    attachTo: { element: '.dashboard-header', on: 'bottom' },
    buttons: [
      { text: 'Skip', action: 'cancel' },
      { text: 'Next', action: 'next' },
    ],
  },
  {
    id: 'lessons',
    title: 'Your Lessons',
    text: 'Browse and start lessons here',
    attachTo: { element: '.lessons-section', on: 'top' },
    buttons: [
      { text: 'Back', action: 'back' },
      { text: 'Next', action: 'next' },
    ],
  },
  // Add more steps
];

export function InteractiveTour({ onComplete }: Props) {
  return (
    <Shepherd
      steps={tourSteps}
      onComplete={onComplete}
      tourOptions={{
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          classes: 'shepherd-theme-custom',
        },
        useModalOverlay: true,
      }}
    />
  );
}
```

#### 2.4 Progress Visualization
**Impact:** Medium | **Effort:** Medium

Better progress tracking:

```typescript
// src/components/dashboard/ProgressChart.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

export function WeeklyProgressChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Line 
              type="monotone" 
              dataKey="lessons" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="points" 
              stroke="#82ca9d" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

#### 2.5 Toast Notification Improvements
**Impact:** Low | **Effort:** Low

Enhance notifications with actions:

```typescript
// Enhanced toast with action
toast({
  title: 'Lesson Completed!',
  description: `You earned ${points} points`,
  action: (
    <Button variant="outline" size="sm" onClick={() => navigate('/badges')}>
      View Badges
    </Button>
  ),
  duration: 5000,
});

// Toast with progress for long operations
const toastId = toast({
  title: 'Generating lesson...',
  description: <Progress value={0} />,
  duration: Infinity,
});

// Update progress
updateToast(toastId, {
  description: <Progress value={50} />,
});

// Complete
updateToast(toastId, {
  title: 'Lesson Generated!',
  description: 'Your custom lesson is ready',
  duration: 3000,
});
```

#### 2.6 Accessibility Improvements
**Impact:** High | **Effort:** Medium

```typescript
// Add ARIA labels
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// Add skip navigation
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  }
  if (e.key === 'Enter' || e.key === ' ') {
    selectItem();
  }
};

// Focus management
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus();
  }
}, [isOpen]);

// Screen reader announcements
const [announcement, setAnnouncement] = useState('');

<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>

// Update announcement
setAnnouncement('Lesson completed successfully');
```

---

## 3. Performance Improvements

### Priority: P1 (High) 🟡

#### 3.1 Image Optimization
**Impact:** High | **Effort:** Medium

```typescript
// src/components/ui/OptimizedImage.tsx
export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          props.className
        )}
        {...props}
      />
    </div>
  );
}

// Use WebP with fallback
<picture>
  <source srcSet={`${url}.webp`} type="image/webp" />
  <source srcSet={`${url}.jpg`} type="image/jpeg" />
  <img src={`${url}.jpg`} alt={alt} />
</picture>
```

#### 3.2 Database Query Optimization
**Impact:** High | **Effort:** Medium

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_lessons_grade_subject ON lessons(grade_level, subject, is_active);
CREATE INDEX idx_user_progress_child ON user_progress(child_id, status);
CREATE INDEX idx_lessons_active ON lessons(is_active) WHERE is_active = true;
CREATE INDEX idx_children_parent ON children(parent_id);

-- Composite index for common queries
CREATE INDEX idx_lessons_grade_subject_active 
ON lessons(grade_level, subject) WHERE is_active = true;

-- Add index for text search
CREATE INDEX idx_lessons_title_trgm ON lessons USING gin(title gin_trgm_ops);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### 3.3 Pagination Implementation
**Impact:** Medium | **Effort:** Medium

```typescript
// src/hooks/usePaginatedLessons.ts
export function usePaginatedLessons(gradeLevel: number, pageSize = 20) {
  const [page, setPage] = useState(0);
  
  const { data, isLoading, hasNextPage } = useInfiniteQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('grade_level', gradeLevel)
        .eq('is_active', true)
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);
      
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, pages) => 
      lastPage.length === pageSize ? pages.length : undefined,
  });

  return {
    lessons: data?.pages.flat() ?? [],
    isLoading,
    hasNextPage,
    loadMore: () => setPage(p => p + 1),
  };
}

// Infinite scroll component
export function InfiniteLessonList() {
  const { lessons, loadMore, hasNextPage } = usePaginatedLessons(3);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      loadMore();
    }
  }, [inView, hasNextPage, loadMore]);

  return (
    <div>
      {lessons.map(lesson => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
      {hasNextPage && <div ref={ref}>Loading...</div>}
    </div>
  );
}
```

#### 3.4 Bundle Size Optimization
**Impact:** Medium | **Effort:** Low

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});

// Tree-shaking optimization
// Import only what you need
import { Button } from '@/components/ui/button'; // ✅
// Instead of
import * as UI from '@/components/ui'; // ❌
```

#### 3.5 Caching Strategy
**Impact:** Medium | **Effort:** Low

```typescript
// Configure React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Prefetch data
const prefetchLessons = async (gradeLevel: number) => {
  await queryClient.prefetchQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: () => lessonsApi.getByGrade(gradeLevel),
  });
};

// Use on navigation
<Link 
  to="/lessons" 
  onMouseEnter={() => prefetchLessons(currentGrade)}
>
  View Lessons
</Link>
```

---

## 4. Developer Experience

### Priority: P2 (Medium) 🟢

#### 4.1 Better Development Tools
**Impact:** Medium | **Effort:** Low

```typescript
// Add to package.json
{
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host", // Test on mobile devices
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "analyze": "vite-bundle-visualizer"
  }
}
```

#### 4.2 Component Documentation
**Impact:** Medium | **Effort:** Medium

Add Storybook:

```bash
npx sb init
```

```typescript
// src/components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline',
  },
};
```

#### 4.3 Environment Configuration
**Impact:** Low | **Effort:** Low

```typescript
// src/config/env.ts
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

// Validate environment variables
requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Type-safe environment
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
} as const;
```

#### 4.4 Git Hooks
**Impact:** Low | **Effort:** Low

```bash
# Install husky
npm install -D husky lint-staged

# Setup
npx husky-init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

---

## 5. Documentation Improvements

### Priority: P2 (Medium) 🟢

#### 5.1 API Documentation
**Impact:** Medium | **Effort:** Medium

```typescript
// src/lib/api/README.md
# API Documentation

## Children API

### `childrenApi.getAll(parentId: string)`
Fetches all children for a given parent.

**Parameters:**
- `parentId` (string) - The parent's user ID

**Returns:**
- `Promise<Child[]>` - Array of child objects

**Example:**
```typescript
const children = await childrenApi.getAll(user.id);
```

### `childrenApi.getById(childId: string)`
...
```

#### 5.2 Component Documentation
**Impact:** Low | **Effort:** Low

Add JSDoc comments:

```typescript
/**
 * Displays a lesson card with title, description, and metadata.
 * 
 * @component
 * @example
 * ```tsx
 * <LessonCard
 *   lesson={lesson}
 *   onStart={(id) => navigate(`/lessons/${id}`)}
 * />
 * ```
 */
export function LessonCard({ lesson, onStart }: LessonCardProps) {
  // ...
}
```

#### 5.3 Architecture Documentation
**Impact:** Medium | **Effort:** Medium

Create `docs/ARCHITECTURE.md`:

```markdown
# Architecture Overview

## Frontend Architecture

### Component Structure
- Atomic design pattern
- Container/Presentational separation
- Compound components for complex UI

### State Management
- Server state: React Query
- Client state: React Context
- Form state: React Hook Form

### Routing
- React Router v6
- Protected routes with auth guards
- Lazy loading for code splitting

## Backend Architecture

### Database
- PostgreSQL via Supabase
- Row-Level Security for authorization
- Triggers for automated tasks

### Authentication
- Supabase Auth
- JWT tokens
- Role-based access control
```

---

## 6. Analytics & Monitoring

### Priority: P2 (Medium) 🟢

#### 6.1 User Analytics
**Impact:** Medium | **Effort:** Medium

```typescript
// src/lib/analytics.ts
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      // e.g., Plausible, PostHog, or Google Analytics
    } else {
      console.log('[Analytics]', event, properties);
    }
  },

  page: (pageName: string) => {
    analytics.track('page_view', { page: pageName });
  },

  lessonStarted: (lessonId: string, childId: string) => {
    analytics.track('lesson_started', { lessonId, childId });
  },

  lessonCompleted: (lessonId: string, childId: string, score: number) => {
    analytics.track('lesson_completed', { lessonId, childId, score });
  },

  badgeEarned: (badgeId: string, childId: string) => {
    analytics.track('badge_earned', { badgeId, childId });
  },
};

// Usage in components
useEffect(() => {
  analytics.page('ChildDashboard');
}, []);

const handleLessonStart = (lessonId: string) => {
  analytics.lessonStarted(lessonId, childId);
  navigate(`/lessons/${lessonId}`);
};
```

#### 6.2 Error Tracking
**Impact:** High | **Effort:** Low

```typescript
// src/lib/errorTracking.ts
export function initErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    // Initialize Sentry or similar
    // Sentry.init({ dsn: '...' });
  }

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to error tracking service
  });
}
```

#### 6.3 Performance Monitoring
**Impact:** Medium | **Effort:** Low

```typescript
// src/lib/performance.ts
export function reportWebVitals(metric: Metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics
    analytics.track('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }
}

// In main.tsx
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

onCLS(reportWebVitals);
onFID(reportWebVitals);
onFCP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);
```

---

## 7. Mobile Experience

### Priority: P1 (High) 🟡

#### 7.1 Responsive Design Audit
**Impact:** High | **Effort:** Medium

Test and fix:
- [ ] All pages work on mobile (320px - 768px)
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable without zooming
- [ ] Forms are mobile-friendly
- [ ] Navigation is accessible

#### 7.2 Touch Interactions
**Impact:** Medium | **Effort:** Low

```typescript
// Add touch-friendly interactions
<button
  className="active:scale-95 transition-transform"
  onTouchStart={(e) => e.currentTarget.classList.add('touch-active')}
  onTouchEnd={(e) => e.currentTarget.classList.remove('touch-active')}
>
  Press me
</button>

// Swipe gestures
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => navigateNext(),
  onSwipedRight: () => navigatePrevious(),
  trackMouse: true,
});

<div {...handlers}>Swipeable content</div>
```

#### 7.3 Progressive Web App (PWA)
**Impact:** High | **Effort:** Medium

```typescript
// vite-plugin-pwa configuration
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Odyssey Learns',
        short_name: 'Odyssey',
        description: 'Educational platform for children',
        theme_color: '#8B5CF6',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

---

## 8. Content Management

### Priority: P2 (Medium) 🟢

#### 8.1 Rich Text Editor for Lessons
**Impact:** Medium | **Effort:** Medium

```bash
npm install @tiptap/react @tiptap/starter-kit
```

```typescript
// src/components/admin/RichTextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="prose p-4" />
    </div>
  );
}
```

#### 8.2 Lesson Templates
**Impact:** Medium | **Effort:** Low

```typescript
// src/lib/lessonTemplates.ts
export const lessonTemplates = {
  reading: {
    title: 'Reading Comprehension: {topic}',
    structure: `
# {title}

## Introduction
Brief introduction to the topic...

## Main Content
### Key Points
- Point 1
- Point 2
- Point 3

## Practice Questions
1. Question 1
2. Question 2
3. Question 3

## Summary
Wrap up the lesson...
    `,
  },
  math: {
    // Similar structure
  },
};
```

---

## Implementation Timeline

### Weeks 1-2: Security & Critical (P0)
- Fix npm vulnerabilities
- Implement CSP
- Add server-side validation
- Server-side rate limiting

### Weeks 3-4: UX Improvements (P1)
- Better loading/empty states
- Accessibility audit & fixes
- Progress visualization
- Toast improvements

### Weeks 5-6: Performance (P1)
- Image optimization
- Database indexes
- Pagination
- Bundle optimization

### Weeks 7-8: Mobile & PWA (P1)
- Responsive design fixes
- Touch interactions
- PWA setup

### Weeks 9-10: Developer Experience (P2)
- Testing tools
- Documentation
- Storybook setup

### Weeks 11-12: Analytics & Content (P2)
- Analytics integration
- Error tracking
- Rich text editor
- Lesson templates

## Success Metrics

### Security
- ✅ 0 security vulnerabilities
- ✅ CSP implemented
- ✅ Server-side validation in place

### Performance
- ✅ Lighthouse score > 90
- ✅ Bundle size < 500KB
- ✅ FCP < 1.5s

### User Experience
- ✅ All pages responsive
- ✅ WCAG 2.1 AA compliant
- ✅ Touch-friendly interface

### Developer Experience
- ✅ Test coverage > 50%
- ✅ Complete documentation
- ✅ Storybook for components

## Conclusion

These improvements will enhance security, user experience, performance, and maintainability. Prioritize based on user needs and available resources. Each improvement can be implemented incrementally without disrupting existing functionality.
