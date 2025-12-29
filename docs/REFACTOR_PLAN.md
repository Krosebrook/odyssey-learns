# Refactor Plan
**Project:** Odyssey Learns  
**Date:** 2025-12-29  
**Priority:** High

## Overview

This refactoring plan addresses the technical debt and code quality issues identified in the codebase audit. The plan is organized by priority and estimated effort, ensuring minimal disruption while maximizing improvement.

## Guiding Principles

1. **Type Safety First** - Eliminate all `any` types
2. **Don't Break Working Code** - Incremental, tested changes
3. **Consistency Over Perfection** - Standardize patterns across codebase
4. **Performance Matters** - Optimize while refactoring
5. **Test Coverage Required** - Add tests before major refactors

## Phase 1: Type Safety & TypeScript (2-3 weeks)

### Priority: Critical 🔴

### Goal
Eliminate all 141 `@typescript-eslint/no-explicit-any` errors and improve type safety.

### Tasks

#### 1.1 Create Type Definitions
**Effort:** 3 days  
**Files:** `src/types/`

Create centralized type definitions:

```typescript
// src/types/database.ts
export interface Profile {
  id: string;
  role: 'parent' | 'child';
  full_name: string;
  avatar_url?: string;
  created_at: string;
  onboarding_completed?: boolean;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  grade_level: number;
  avatar_config: AvatarConfig;
  total_points: number;
  pin_hash?: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  grade_level: number;
  subject: LessonSubject;
  title: string;
  description?: string;
  content_markdown: string;
  estimated_minutes: number;
  points_value: number;
  quiz_questions?: QuizQuestion[];
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  child_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  time_spent_seconds: number;
  completed_at?: string;
  created_at: string;
}

export interface Reward {
  id: string;
  parent_id: string;
  name: string;
  description?: string;
  points_cost: number;
  is_active: boolean;
  redemption_count: number;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  child_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  resolved_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  points_value: number;
}

export interface DailyQuest {
  id: string;
  child_id: string;
  quest_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  reward_points: number;
  expires_at: string;
  completed_at?: string;
  created_at: string;
}

// Add more types for all database entities
```

```typescript
// src/types/components.ts
export interface DashboardStats {
  completed: number;
  streak: number;
  totalPoints: number;
  badgesEarned: number;
}

export interface LessonFilters {
  subject?: string;
  gradeLevel?: number;
  searchTerm?: string;
}

export interface CelebrationData {
  type: 'lesson_complete' | 'badge_earned' | 'quest_complete';
  title: string;
  message: string;
  points?: number;
  badge?: Badge;
}
```

#### 1.2 Refactor Components with Strong Types
**Effort:** 1 week  
**Approach:** 10-15 components per day

Priority order:
1. Core pages (ChildDashboard, ParentDashboard, Lessons)
2. Auth components
3. Learning components
4. UI components
5. Admin components

**Before:**
```typescript
const [child, setChild] = useState<any>(null);
const [lessons, setLessons] = useState<any[]>([]);
```

**After:**
```typescript
const [child, setChild] = useState<Child | null>(null);
const [lessons, setLessons] = useState<Lesson[]>([]);
```

#### 1.3 Update Supabase Query Return Types
**Effort:** 2 days

```typescript
// Before
const { data: childData } = await supabase
  .from('children')
  .select('*')
  .eq('id', childId)
  .single();

// After
const { data: childData } = await supabase
  .from('children')
  .select('*')
  .eq('id', childId)
  .single();

if (childData) {
  const typedChild: Child = childData;
  setChild(typedChild);
}
```

#### 1.4 Add Generic Types for Hooks
**Effort:** 1 day

```typescript
// Before
const [data, setData] = useState<any>(null);

// After
function useData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  // ...
}
```

### Success Criteria
- ✅ Zero `@typescript-eslint/no-explicit-any` errors
- ✅ All data interfaces defined in `src/types/`
- ✅ IntelliSense works for all data structures
- ✅ Type errors caught at compile time

---

## Phase 2: React Hooks & Component Quality (1-2 weeks)

### Priority: High 🟡

### Goal
Fix all 38 React hooks dependency warnings and improve component patterns.

### Tasks

#### 2.1 Fix useEffect Dependencies
**Effort:** 3 days  
**Approach:** Fix 15-20 warnings per day

**Strategy:**
```typescript
// Pattern 1: Add missing dependencies
useEffect(() => {
  loadData();
}, [loadData]); // Add dependency

// Pattern 2: Use useCallback for functions
const loadData = useCallback(async () => {
  // fetch logic
}, [dependency1, dependency2]);

// Pattern 3: Extract to custom hook
function useLoadData() {
  useEffect(() => {
    // fetch logic
  }, [/* proper deps */]);
}
```

#### 2.2 Create Custom Hooks for Common Patterns
**Effort:** 3 days

Create reusable hooks:

```typescript
// src/hooks/useChild.ts
export function useChild(childId: string | null) {
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchChild() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('id', childId)
          .single();

        if (cancelled) return;

        if (error) throw error;
        setChild(data);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChild();

    return () => {
      cancelled = true;
    };
  }, [childId]);

  return { child, loading, error };
}

// src/hooks/useLessons.ts
export function useLessons(gradeLevel: number, filters?: LessonFilters) {
  // Similar pattern
}

// src/hooks/useProgress.ts
export function useProgress(childId: string) {
  // Similar pattern
}
```

#### 2.3 Standardize Loading States
**Effort:** 2 days

Create consistent loading components:

```typescript
// src/components/ui/loading-states.tsx
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-center">
        <LoadingSpinner />
      </div>
    </Card>
  );
}

export function LoadingInline() {
  return <LoadingSpinner size="sm" />;
}
```

#### 2.4 Standardize Empty States
**Effort:** 2 days

```typescript
// src/components/ui/empty-states.tsx
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Icon className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action}
    </div>
  );
}
```

### Success Criteria
- ✅ Zero React hooks warnings
- ✅ All common patterns extracted to custom hooks
- ✅ Consistent loading/empty states across app
- ✅ No memory leaks from useEffect

---

## Phase 3: Error Handling & Resilience (1 week)

### Priority: High 🟡

### Goal
Implement consistent, user-friendly error handling throughout the application.

### Tasks

#### 3.1 Create Error Boundary
**Effort:** 1 day

```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <h2>Something went wrong</h2>
            <p>We're sorry for the inconvenience.</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 3.2 Standardize Error Handling Pattern
**Effort:** 2 days

```typescript
// src/lib/errorHandling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
  }
}

export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.'
    );
  }

  return new AppError(
    'Unknown error',
    'UNKNOWN_ERROR',
    'An unexpected error occurred. Please try again.'
  );
}

export function useErrorHandler() {
  const { toast } = useToast();

  return useCallback((error: unknown, context?: string) => {
    const appError = handleError(error, context);
    toast({
      title: 'Error',
      description: appError.userMessage,
      variant: 'destructive',
    });
  }, [toast]);
}
```

#### 3.3 Add Error States to Components
**Effort:** 2 days

```typescript
// Pattern for all data-fetching components
function SomeComponent() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const handleError = useErrorHandler();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetchSomething();
        setData(result);
        setError(null);
      } catch (err) {
        handleError(err, 'SomeComponent.fetchData');
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [handleError]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (!data) return <EmptyState />;

  return <div>{/* render data */}</div>;
}
```

#### 3.4 Add Retry Logic
**Effort:** 1 day

```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Success Criteria
- ✅ Global error boundary implemented
- ✅ Consistent error handling across all components
- ✅ User-friendly error messages
- ✅ Error logging in place
- ✅ Retry logic for failed requests

---

## Phase 4: Data Fetching & State Management (1-2 weeks)

### Priority: Medium 🟡

### Goal
Centralize data fetching, eliminate duplicate queries, implement proper caching.

### Tasks

#### 4.1 Create Data Fetching Layer
**Effort:** 3 days

```typescript
// src/lib/api/children.ts
export const childrenApi = {
  getAll: async (parentId: string): Promise<Child[]> => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getById: async (childId: string): Promise<Child> => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (childId: string, updates: Partial<Child>): Promise<Child> => {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Similar for lessons, progress, rewards, etc.
```

#### 4.2 Integrate with React Query
**Effort:** 3 days

```typescript
// src/hooks/queries/useChildren.ts
export function useChildren(parentId: string) {
  return useQuery({
    queryKey: ['children', parentId],
    queryFn: () => childrenApi.getAll(parentId),
    enabled: !!parentId,
  });
}

export function useChild(childId: string | null) {
  return useQuery({
    queryKey: ['children', childId],
    queryFn: () => childrenApi.getById(childId!),
    enabled: !!childId,
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, updates }: { childId: string; updates: Partial<Child> }) =>
      childrenApi.update(childId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['children', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
}
```

#### 4.3 Implement Optimistic Updates
**Effort:** 2 days

```typescript
export function useCompleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, lessonId }: { childId: string; lessonId: string }) =>
      progressApi.complete(childId, lessonId),
    onMutate: async ({ childId, lessonId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['progress', childId] });
      
      // Snapshot previous value
      const previousProgress = queryClient.getQueryData(['progress', childId]);
      
      // Optimistically update
      queryClient.setQueryData(['progress', childId], (old: UserProgress[]) => {
        return old.map(p => 
          p.lesson_id === lessonId 
            ? { ...p, status: 'completed' as const } 
            : p
        );
      });
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(
          ['progress', variables.childId],
          context.previousProgress
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', variables.childId] });
    },
  });
}
```

#### 4.4 Add Request Deduplication
**Effort:** 1 day

React Query handles this automatically, but ensure proper query keys:

```typescript
// Good - specific keys
['children', parentId]
['lessons', gradeLevel, subject]
['progress', childId, lessonId]

// Bad - too generic
['data']
['items']
```

### Success Criteria
- ✅ All API calls centralized in `src/lib/api/`
- ✅ React Query used for all server state
- ✅ Optimistic updates for mutations
- ✅ Proper cache invalidation
- ✅ No duplicate network requests

---

## Phase 5: Component Refactoring (2 weeks)

### Priority: Medium 🟡

### Goal
Reduce code duplication, improve component reusability, standardize patterns.

### Tasks

#### 5.1 Extract Common Patterns
**Effort:** 4 days

Identify and extract repeated patterns:

```typescript
// Pattern: Data table with loading/error/empty states
export function DataTable<T>({
  data,
  loading,
  error,
  columns,
  emptyMessage,
  onRetry,
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <Table>
      {/* render table */}
    </Table>
  );
}

// Pattern: Card with stats
export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <Icon className={`w-8 h-8 ${color}`} />
        <div className="ml-4">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && <TrendIndicator trend={trend} />}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 5.2 Create Composite Components
**Effort:** 3 days

```typescript
// src/components/lessons/LessonCard.tsx
export function LessonCard({ lesson, onStart }: LessonCardProps) {
  return (
    <Card>
      <LessonThumbnail url={lesson.thumbnail_url} />
      <LessonHeader title={lesson.title} subject={lesson.subject} />
      <LessonMeta
        duration={lesson.estimated_minutes}
        points={lesson.points_value}
        gradeLevel={lesson.grade_level}
      />
      <LessonDescription text={lesson.description} />
      <LessonActions onStart={() => onStart(lesson.id)} />
    </Card>
  );
}

// Composable sub-components
function LessonThumbnail({ url }: { url?: string }) {
  return (
    <div className="aspect-video relative">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500" />
      )}
    </div>
  );
}
```

#### 5.3 Refactor Large Components
**Effort:** 4 days

Break down components over 300 lines:

**Before:** ChildDashboard.tsx (500+ lines)

**After:**
```
ChildDashboard.tsx (150 lines)
  ├── DashboardHeader.tsx
  ├── DashboardStats.tsx
  ├── QuickActions.tsx
  ├── RecentLessons.tsx
  └── DailyQuestSection.tsx
```

#### 5.4 Create Render Props / Compound Components
**Effort:** 2 days

```typescript
// Flexible modal pattern
export function Modal({ children, ...props }: ModalProps) {
  return (
    <Dialog {...props}>
      {children}
    </Dialog>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

// Usage
<Modal open={open} onClose={onClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>
    <Button>Action</Button>
  </Modal.Footer>
</Modal>
```

### Success Criteria
- ✅ No component over 300 lines
- ✅ Common patterns extracted to reusable components
- ✅ Improved component composition
- ✅ Reduced code duplication by 30%+

---

## Phase 6: Performance Optimization (1 week)

### Priority: Medium 🟡

### Goal
Improve application performance through code splitting, memoization, and optimization.

### Tasks

#### 6.1 Implement Code Splitting
**Effort:** 2 days

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load routes
const ChildDashboard = lazy(() => import('./pages/ChildDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const Lessons = lazy(() => import('./pages/Lessons'));
const LessonPlayer = lazy(() => import('./pages/LessonPlayer'));
// ... etc

function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/dashboard" element={<ChildDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

#### 6.2 Add React.memo() Where Appropriate
**Effort:** 2 days

```typescript
// Components that render frequently with same props
export const LessonCard = memo(function LessonCard({ lesson }: Props) {
  return <Card>{/* ... */}</Card>;
});

export const StatCard = memo(function StatCard({ value, label }: Props) {
  return <Card>{/* ... */}</Card>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.value === nextProps.value &&
         prevProps.label === nextProps.label;
});
```

#### 6.3 Optimize Re-renders
**Effort:** 2 days

```typescript
// Use useCallback for event handlers
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Use useMemo for expensive calculations
const filteredLessons = useMemo(() => {
  return lessons.filter(l => 
    l.subject === selectedSubject &&
    l.grade_level === gradeLevel
  );
}, [lessons, selectedSubject, gradeLevel]);

// Avoid inline object creation
// Bad
<Component style={{ margin: 10 }} />

// Good
const style = { margin: 10 };
<Component style={style} />
```

#### 6.4 Virtualize Long Lists
**Effort:** 1 day

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LessonList({ lessons }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: lessons.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <LessonCard lesson={lessons[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Success Criteria
- ✅ Route-based code splitting implemented
- ✅ Initial bundle size reduced by 40%+
- ✅ Unnecessary re-renders eliminated
- ✅ Long lists virtualized
- ✅ Lighthouse performance score > 85

---

## Phase 7: Testing Infrastructure (1-2 weeks)

### Priority: High 🟡

### Goal
Add comprehensive testing infrastructure and achieve meaningful test coverage.

### Tasks

#### 7.1 Set Up Testing Framework
**Effort:** 1 day

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

#### 7.2 Create Test Utilities
**Effort:** 2 days

```typescript
// src/test/utils.tsx
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock Supabase
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
};
```

#### 7.3 Write Unit Tests
**Effort:** 4 days

```typescript
// src/lib/__tests__/inputSanitization.test.ts
describe('sanitizeHTML', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeHTML(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('should escape quotes', () => {
    const input = 'Hello "world"';
    const output = sanitizeHTML(input);
    expect(output).toContain('&quot;');
  });
});

// src/hooks/__tests__/useAuth.test.ts
describe('useAuth', () => {
  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.user).toBeNull();
  });
});
```

#### 7.4 Write Component Tests
**Effort:** 5 days

```typescript
// src/components/__tests__/LessonCard.test.tsx
describe('LessonCard', () => {
  const mockLesson: Lesson = {
    id: '1',
    title: 'Test Lesson',
    subject: 'math',
    grade_level: 3,
    points_value: 50,
    estimated_minutes: 15,
    // ...
  };

  it('should render lesson title', () => {
    renderWithProviders(<LessonCard lesson={mockLesson} />);
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
  });

  it('should call onStart when button clicked', async () => {
    const onStart = vi.fn();
    renderWithProviders(<LessonCard lesson={mockLesson} onStart={onStart} />);
    
    const button = screen.getByRole('button', { name: /start/i });
    await userEvent.click(button);
    
    expect(onStart).toHaveBeenCalledWith(mockLesson.id);
  });
});
```

#### 7.5 Add Integration Tests
**Effort:** 2 days

```typescript
// src/pages/__tests__/ChildDashboard.test.tsx
describe('ChildDashboard', () => {
  it('should load and display dashboard data', async () => {
    // Mock API responses
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'children') {
        return createMockQuery({ data: mockChild });
      }
      if (table === 'lessons') {
        return createMockQuery({ data: mockLessons });
      }
      return createMockQuery({ data: [] });
    });

    renderWithProviders(<ChildDashboard />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check data is displayed
    expect(screen.getByText(mockChild.name)).toBeInTheDocument();
    expect(screen.getByText(/lessons available/i)).toBeInTheDocument();
  });
});
```

### Success Criteria
- ✅ Testing framework configured
- ✅ Test utilities created
- ✅ 60%+ code coverage for utilities
- ✅ 50%+ code coverage for hooks
- ✅ 40%+ code coverage for components
- ✅ Critical paths have integration tests

---

## Implementation Schedule

### Week 1-2: Type Safety
- Days 1-3: Create type definitions
- Days 4-8: Refactor components with types
- Days 9-10: Update Supabase queries

### Week 3-4: Hooks & Components
- Days 1-3: Fix useEffect dependencies
- Days 4-6: Create custom hooks
- Days 7-10: Standardize states

### Week 5: Error Handling
- Days 1-2: Error boundary & handling
- Days 3-4: Add error states
- Day 5: Testing & refinement

### Week 6-7: Data Fetching
- Days 1-3: Create API layer
- Days 4-6: React Query integration
- Days 7-8: Optimistic updates
- Days 9-10: Testing & optimization

### Week 8-9: Component Refactoring
- Days 1-4: Extract common patterns
- Days 5-7: Create composite components
- Days 8-10: Refactor large components

### Week 10: Performance
- Days 1-2: Code splitting
- Days 3-4: Memoization
- Day 5: Virtualization

### Week 11-12: Testing
- Day 1: Setup
- Days 2-3: Test utilities
- Days 4-7: Unit tests
- Days 8-10: Component & integration tests

## Success Metrics

### Code Quality
- TypeScript errors: 0
- ESLint errors: 0
- Test coverage: >50%

### Performance
- Bundle size: < 500KB (gzipped)
- Lighthouse performance: > 85
- Time to Interactive: < 3s

### Maintainability
- Average component size: < 200 lines
- Code duplication: < 5%
- Cyclomatic complexity: < 10

## Risk Mitigation

1. **Breaking Changes**
   - Create feature branch
   - Incremental refactoring
   - Comprehensive testing

2. **Timeline Slippage**
   - Prioritize critical phases
   - Can extend Medium priority phases
   - Regular progress reviews

3. **Team Capacity**
   - Can parallelize some phases
   - Clear documentation
   - Code review process

## Conclusion

This refactoring plan provides a structured approach to improving code quality while minimizing disruption. Each phase builds on the previous, creating a more maintainable, performant, and testable codebase.

**Estimated Total Time:** 10-12 weeks  
**Risk Level:** Low (incremental approach)  
**ROI:** High (improved quality, reduced bugs, easier maintenance)
