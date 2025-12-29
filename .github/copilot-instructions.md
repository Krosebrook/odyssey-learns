# GitHub Copilot Instructions for Odyssey Learns

## Project Overview
Odyssey Learns is an educational platform for children (K-12) with parent oversight. Built with React 18, TypeScript, Vite, Supabase, and shadcn/ui. The platform features interactive lessons, gamification (points, badges, quests), avatar customization, and progress tracking.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI**: shadcn/ui (Radix UI primitives), Tailwind CSS
- **State**: React Query (@tanstack/react-query), React Context
- **Forms**: React Hook Form, Zod validation
- **Router**: React Router v6
- **Animations**: Framer Motion

## Code Style & Conventions

### TypeScript
- **NEVER use `any` type** - Define proper interfaces/types
- Prefer `interface` over `type` for object shapes
- Export types from `src/types/` for reuse
- Use strict mode (already configured)

Example:
```typescript
// ❌ Bad
const [child, setChild] = useState<any>(null);

// ✅ Good
interface Child {
  id: string;
  name: string;
  age: number;
  grade_level: number;
  parent_id: string;
}
const [child, setChild] = useState<Child | null>(null);
```

### React Components
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Prefer composition over complex components
- Use `React.memo` only when profiling shows benefit

Component structure:
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component definition
// 4. Exports

interface LessonCardProps {
  lesson: Lesson;
  onStart: (id: string) => void;
}

export function LessonCard({ lesson, onStart }: LessonCardProps) {
  // hooks first
  const [isHovered, setIsHovered] = useState(false);
  
  // event handlers
  const handleClick = () => {
    onStart(lesson.id);
  };
  
  // render
  return (
    <Card onMouseEnter={() => setIsHovered(true)}>
      {/* ... */}
    </Card>
  );
}
```

### React Hooks
- **ALWAYS** include all dependencies in useEffect arrays
- Use `useCallback` for stable function references
- Use `useMemo` for expensive computations
- Create custom hooks for complex logic

Example:
```typescript
// ✅ Good - all dependencies included
useEffect(() => {
  loadLessons(gradeLevel);
}, [gradeLevel, loadLessons]);

// ✅ Good - stable function with useCallback
const loadLessons = useCallback(async (grade: number) => {
  const data = await fetchLessons(grade);
  setLessons(data);
}, []);
```

### Data Fetching
- Use React Query for all server state
- Centralize queries in `src/hooks/`
- Use optimistic updates for better UX
- Handle loading, error, and success states

Example:
```typescript
export function useLessons(gradeLevel: number) {
  return useQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: () => getLessons(gradeLevel),
    staleTime: 5 * 60 * 1000,
  });
}

// Usage
const { data: lessons, isLoading, error } = useLessons(gradeLevel);
```

### Supabase Queries
- Always handle errors
- Use Row-Level Security (RLS) policies
- Sanitize user inputs
- Use typed queries with generated types

Example:
```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('id, title, content_markdown, grade_level')
  .eq('grade_level', gradeLevel)
  .eq('is_active', true)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching lessons:', error);
  throw error;
}

return data;
```

### Forms & Validation
- Use React Hook Form for forms
- Define Zod schemas for validation
- Validate on both client and server
- Sanitize inputs before submission

Example:
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const lessonSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(50000),
  grade_level: z.number().int().min(0).max(12),
});

type LessonFormData = z.infer<typeof lessonSchema>;

function LessonForm() {
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });
  
  const onSubmit = async (data: LessonFormData) => {
    // Submit to Supabase
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Security
- **ALWAYS** sanitize user inputs (use `src/lib/inputSanitization.ts`)
- **NEVER** trust client-side data - validate server-side too
- Use DOMPurify for rendering user-generated content
- Implement rate limiting for sensitive operations
- Check RLS policies for all database tables

Example:
```typescript
import { sanitizeText } from '@/lib/inputSanitization';
import DOMPurify from 'dompurify';

// Sanitize before saving
const sanitizedTitle = sanitizeText(formData.title);

// Sanitize before rendering
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(content) 
}} />
```

### Error Handling
- Use toast notifications for user-facing errors
- Log errors to console in development
- Use error boundaries for component errors
- Provide helpful error messages

Example:
```typescript
import { toast } from 'sonner';

try {
  await saveLesson(data);
  toast.success('Lesson saved successfully!');
} catch (error) {
  console.error('Error saving lesson:', error);
  toast.error('Failed to save lesson. Please try again.');
}
```

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui patterns
- Responsive by default (mobile-first)
- Use `cn()` utility for conditional classes

Example:
```typescript
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    'base-classes',
    isActive && 'active-classes',
    isDisabled && 'disabled-classes'
  )}
>
  Click me
</Button>
```

### Accessibility
- Include ARIA labels for interactive elements
- Ensure keyboard navigation works
- Use semantic HTML
- Test with screen readers
- Minimum touch target size: 44x44px

Example:
```typescript
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="p-2 rounded hover:bg-gray-100"
>
  <X className="w-4 h-4" />
</button>
```

## File Organization

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── learning/        # Lesson-related components
│   ├── parent/          # Parent dashboard features
│   └── [feature]/       # Feature-based organization
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── pages/               # Page components (routes)
├── types/               # TypeScript type definitions
└── integrations/        # External service integrations
    └── supabase/        # Supabase client and types
```

## Common Patterns

### Loading States
```typescript
if (isLoading) {
  return <div className="flex justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>;
}
```

### Empty States
```typescript
if (!lessons?.length) {
  return <div className="text-center p-8">
    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-600">No lessons available yet.</p>
  </div>;
}
```

### Error States
```typescript
if (error) {
  return <div className="text-center p-8 text-red-600">
    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
    <p>Failed to load lessons. Please try again.</p>
  </div>;
}
```

## Testing
- Write tests for critical user flows
- Use Vitest + React Testing Library
- Test user behavior, not implementation
- Mock external dependencies (Supabase)

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('renders lesson card with title', () => {
  render(<LessonCard lesson={mockLesson} />);
  expect(screen.getByText(mockLesson.title)).toBeInTheDocument();
});
```

## Performance
- Lazy load routes with `React.lazy()`
- Use pagination for large lists
- Optimize images (WebP, lazy loading)
- Minimize re-renders with memo/callback
- Monitor bundle size

## Special Considerations

### Children's Data
- This app handles children's data - be extra careful with privacy
- Follow COPPA guidelines
- Secure all child-related endpoints
- Parent must approve all data sharing

### Educational Content
- Content must be age-appropriate
- Validate grade levels (0-12)
- Sanitize all user-generated lesson content
- Support markdown rendering safely

### Gamification
- Points, badges, quests should motivate learning
- Avoid dark patterns or manipulation
- Keep rewards positive and educational
- Parent oversight for reward redemption

## When to Ask for Help
If you're unsure about:
- Complex database queries or RLS policies
- Security implications of a change
- Breaking changes to existing features
- Educational content guidelines

Stop and ask the developer for guidance.

## Resources
- Codebase Audit: `docs/CODEBASE_AUDIT.md`
- Improvement Plan: `docs/IMPROVEMENT_PLAN.md`
- Refactor Plan: `docs/REFACTOR_PLAN.md`
- Security Testing: `docs/security-testing-guide.md`

---

**Remember**: This is an educational platform for children. Code quality, security, and user experience are critical. When in doubt, prefer safety and clarity over cleverness.
