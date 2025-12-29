# Debug Plan
**Project:** Odyssey Learns  
**Date:** 2025-12-29  
**Purpose:** Comprehensive debugging strategy and tools

## Overview

This document outlines debugging strategies, tools, and common issues to help developers identify and fix problems quickly and efficiently.

## Debugging Philosophy

1. **Reproduce First** - Always reproduce the issue before attempting a fix
2. **Isolate the Problem** - Narrow down to specific component/function
3. **Understand Before Fixing** - Know why it's broken before changing code
4. **Test the Fix** - Verify the fix doesn't break other functionality
5. **Document the Issue** - Help future developers avoid the same problem

## Debugging Tools Setup

### 1. Browser DevTools Configuration

#### React DevTools
```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

**Usage:**
- Component tree inspection
- Props and state viewing
- Performance profiling
- Hooks debugging

#### Redux/React Query DevTools
```typescript
// Add to App.tsx for development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}
```

### 2. Console Debugging Utilities

```typescript
// src/lib/debug.ts
export const debug = {
  /**
   * Conditional console.log that only runs in development
   */
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log with timestamp
   */
  time: (label: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [${label}]`, ...args);
    }
  },

  /**
   * Log component render
   */
  render: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RENDER] ${componentName}`, props);
    }
  },

  /**
   * Log API calls
   */
  api: (method: string, endpoint: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${method} ${endpoint}`, data);
    }
  },

  /**
   * Performance timing
   */
  perf: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[PERF] ${label}`);
      return () => console.timeEnd(`[PERF] ${label}`);
    }
    return () => {};
  },

  /**
   * Deep object inspection
   */
  inspect: (obj: any, label?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(label || '[INSPECT]', JSON.stringify(obj, null, 2));
    }
  },

  /**
   * Trace function calls
   */
  trace: (functionName: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.trace(`[TRACE] ${functionName}`, ...args);
    }
  },
};

// Usage in components
debug.log('User clicked button', { userId, action });
const endPerf = debug.perf('fetchLessons');
await fetchLessons();
endPerf();
```

### 3. Custom React DevTools Hook

```typescript
// src/hooks/useDebug.ts
import { useEffect, useRef } from 'react';

export function useDebug(componentName: string, props?: any) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}`);
      
      if (prevProps.current && props) {
        // Find changed props
        const changedProps = Object.keys(props).filter(
          key => prevProps.current[key] !== props[key]
        );
        
        if (changedProps.length > 0) {
          console.log(`[${componentName}] Changed props:`, changedProps);
          changedProps.forEach(key => {
            console.log(`  ${key}:`, prevProps.current[key], '->', props[key]);
          });
        }
      }
      
      prevProps.current = props;
    }
  });
}

// Usage
function MyComponent(props) {
  useDebug('MyComponent', props);
  // ... rest of component
}
```

### 4. Network Request Debugging

```typescript
// src/lib/api/debug.ts
export function debugSupabaseQuery(
  table: string,
  operation: string,
  params?: any
) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[SUPABASE] ${operation} ${table}`);
    console.log('Params:', params);
    console.time('Query time');
  }

  return {
    end: (result: any, error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('Query time');
        if (error) {
          console.error('Error:', error);
        } else {
          console.log('Result:', result);
        }
        console.groupEnd();
      }
    },
  };
}

// Usage
const tracker = debugSupabaseQuery('lessons', 'select', { grade_level: 3 });
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('grade_level', 3);
tracker.end(data, error);
```

### 5. Source Maps Configuration

Ensure source maps are enabled in development:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps
  },
});
```

## Common Issues & Solutions

### Issue 1: Component Not Re-rendering

**Symptoms:**
- State changes but UI doesn't update
- Props change but component shows stale data

**Debugging Steps:**
1. Check if state is actually changing
```typescript
const [value, setValue] = useState(initial);
console.log('Current value:', value); // Add before render
```

2. Verify object/array references
```typescript
// ❌ Bad - mutating state
state.push(newItem);
setState(state); // Same reference, no re-render

// ✅ Good - new reference
setState([...state, newItem]);
```

3. Check React.memo() dependencies
```typescript
// ❌ Bad - shallow comparison fails
const MemoComponent = memo(MyComponent);

// ✅ Good - custom comparison
const MemoComponent = memo(MyComponent, (prev, next) => {
  return prev.items.length === next.items.length;
});
```

**Solution Checklist:**
- [ ] State is immutably updated
- [ ] Props are not mutated
- [ ] React.memo() comparison is correct
- [ ] Component is not inside conditional

### Issue 2: Infinite Re-render Loop

**Symptoms:**
- Browser freezes/crashes
- "Maximum update depth exceeded" error
- Console flooded with logs

**Debugging Steps:**
1. Add render counter
```typescript
const renderCount = useRef(0);
console.log('Render count:', ++renderCount.current);
```

2. Check useEffect dependencies
```typescript
// ❌ Bad - missing deps causes infinite loop
useEffect(() => {
  setData(fetchData()); // fetchData not in deps
}, []);

// ✅ Good - all deps included
const fetchDataMemo = useCallback(() => fetchData(), []);
useEffect(() => {
  setData(fetchDataMemo());
}, [fetchDataMemo]);
```

3. Look for state updates in render
```typescript
// ❌ Bad - setState during render
function Component() {
  if (!data) {
    fetchData(); // Causes re-render immediately
  }
}

// ✅ Good - setState in useEffect
function Component() {
  useEffect(() => {
    if (!data) {
      fetchData();
    }
  }, [data]);
}
```

**Solution Checklist:**
- [ ] No state updates during render
- [ ] useEffect dependencies are correct
- [ ] No circular dependencies in state updates
- [ ] Object/array dependencies are stable

### Issue 3: Data Not Loading

**Symptoms:**
- Loading spinner never disappears
- No data shown
- No error message

**Debugging Steps:**
1. Check network requests
```typescript
// Add logging to API calls
const { data, error } = await supabase
  .from('lessons')
  .select('*');
console.log('Data:', data, 'Error:', error);
```

2. Verify authentication
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

3. Check Row-Level Security policies
```sql
-- In Supabase SQL editor, test query directly
SELECT * FROM lessons WHERE is_active = true;
```

4. Inspect React Query cache
```typescript
// In component
const queryClient = useQueryClient();
console.log('Cache:', queryClient.getQueryData(['lessons']));
```

**Solution Checklist:**
- [ ] Network request succeeds (check Network tab)
- [ ] User is authenticated
- [ ] RLS policies allow access
- [ ] Data is not cached with stale value
- [ ] Loading state is managed correctly

### Issue 4: Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Browser becomes slow
- Warning: "Can't perform state update on unmounted component"

**Debugging Steps:**
1. Use browser memory profiler
   - Take heap snapshot
   - Compare snapshots over time
   - Look for detached DOM nodes

2. Check for missing cleanup
```typescript
// ❌ Bad - no cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
}, []);

// ✅ Good - cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

3. Check for event listeners
```typescript
// ❌ Bad - event listener not removed
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// ✅ Good - cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

4. Supabase subscriptions
```typescript
// ❌ Bad - subscription not unsubscribed
useEffect(() => {
  supabase
    .from('lessons')
    .on('*', handleChange)
    .subscribe();
}, []);

// ✅ Good - cleanup
useEffect(() => {
  const subscription = supabase
    .from('lessons')
    .on('*', handleChange)
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**Solution Checklist:**
- [ ] All intervals/timeouts are cleared
- [ ] All event listeners are removed
- [ ] All subscriptions are unsubscribed
- [ ] Async operations check if component is mounted

### Issue 5: Performance Issues

**Symptoms:**
- Slow page loads
- Laggy interactions
- Low Lighthouse scores

**Debugging Steps:**
1. Use React Profiler
```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id, phase, actualDuration, baseDuration,
  startTime, commitTime, interactions
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>
```

2. Identify slow components
   - Open React DevTools
   - Go to Profiler tab
   - Record interaction
   - Look for long render times

3. Check unnecessary re-renders
```typescript
// Use React DevTools "Highlight updates" feature
// Or add manual logging
useEffect(() => {
  console.log('Component rendered');
});
```

4. Analyze bundle size
```bash
npm run build
npx vite-bundle-visualizer
```

**Solution Checklist:**
- [ ] Large lists are virtualized
- [ ] Expensive calculations are memoized
- [ ] Components use React.memo() appropriately
- [ ] Images are optimized
- [ ] Code is split by route

### Issue 6: Authentication Issues

**Symptoms:**
- Users can't login
- Unexpected logouts
- Wrong role/permissions

**Debugging Steps:**
1. Check auth state
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
console.log('Role:', session?.user?.user_metadata?.role);
```

2. Verify token
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Access token:', session?.access_token);
console.log('Expires at:', new Date(session?.expires_at * 1000));
```

3. Check auth listener
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

4. Test RLS policies
```sql
-- Switch to user's role in Supabase SQL editor
SET ROLE authenticated;
SELECT * FROM children WHERE parent_id = 'user-uuid';
```

**Solution Checklist:**
- [ ] Auth listener is set up correctly
- [ ] Token is not expired
- [ ] User has correct role
- [ ] RLS policies match role
- [ ] Session is persisted correctly

### Issue 7: Type Errors in Production

**Symptoms:**
- Works in development, fails in production
- Runtime type errors
- Unexpected undefined values

**Debugging Steps:**
1. Enable strict null checks
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

2. Add runtime validation
```typescript
import { z } from 'zod';

const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  grade_level: z.number(),
  // ...
});

// Validate API response
const result = LessonSchema.safeParse(data);
if (!result.success) {
  console.error('Invalid data:', result.error);
}
```

3. Add null checks
```typescript
// ❌ Bad - no null check
const name = user.profile.full_name;

// ✅ Good - optional chaining
const name = user?.profile?.full_name ?? 'Unknown';
```

**Solution Checklist:**
- [ ] All API responses are validated
- [ ] Null checks are in place
- [ ] TypeScript strict mode is enabled
- [ ] Default values are provided

## Debugging Workflow

### Step-by-Step Process

1. **Reproduce the Issue**
   - Clear cache and localStorage
   - Use incognito/private window
   - Note exact steps to reproduce
   - Check if issue is environment-specific

2. **Gather Information**
   - Check browser console for errors
   - Check Network tab for failed requests
   - Check React DevTools for component state
   - Check Application tab for storage data

3. **Form Hypothesis**
   - What do you think is causing the issue?
   - Where in the code would that be?
   - What evidence supports this?

4. **Test Hypothesis**
   - Add logging/breakpoints
   - Isolate the component/function
   - Test with different data
   - Check edge cases

5. **Implement Fix**
   - Make minimal change
   - Add tests for the fix
   - Verify no regressions

6. **Document**
   - Comment complex fixes
   - Update documentation
   - Add to known issues if needed

## Debugging Checklist

### Before Reporting a Bug

- [ ] Reproduced in clean environment (incognito, cleared cache)
- [ ] Checked browser console for errors
- [ ] Checked network tab for failed requests
- [ ] Verified user permissions
- [ ] Tested with different user accounts
- [ ] Checked if issue exists in production
- [ ] Created minimal reproduction case
- [ ] Gathered all error messages and screenshots

### Code Review Debugging

When reviewing code and finding bugs:

- [ ] Identify the root cause, not just symptoms
- [ ] Check for similar issues elsewhere
- [ ] Verify error handling is present
- [ ] Check edge cases
- [ ] Ensure types are correct
- [ ] Verify tests cover the fix

## Advanced Debugging Techniques

### 1. Time Travel Debugging

Using React Query DevTools:
```typescript
// View previous query states
// Replay mutations
// Inspect cache updates
```

### 2. Conditional Breakpoints

In browser DevTools:
```javascript
// Only break when specific condition is met
if (userId === '123') {
  debugger;
}
```

### 3. Network Request Replay

Using browser DevTools:
```
1. Right-click request in Network tab
2. Copy as fetch/cURL
3. Replay in console to test
```

### 4. Console Tricks

```javascript
// Monitor changes to property
monitor(obj.property);

// Copy object to clipboard
copy(obj);

// Get all event listeners
getEventListeners(element);

// Inspect DOM element
inspect(document.querySelector('.class'));
```

### 5. React Error Boundaries

```typescript
// Add error boundary to catch React errors
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Logging Strategy

### Development
- Verbose logging for all operations
- Performance timing
- Component render tracking
- State change tracking

### Staging
- API calls and errors
- Authentication events
- Critical user actions
- Performance metrics

### Production
- Errors only
- Security events
- Business-critical events
- Anonymous usage metrics

### Implementation

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<string, LogLevel[]> = {
  development: ['debug', 'info', 'warn', 'error'],
  staging: ['info', 'warn', 'error'],
  production: ['error'],
};

export const logger = {
  debug: (message: string, data?: any) => {
    if (LOG_LEVELS[process.env.NODE_ENV].includes('debug')) {
      console.log('[DEBUG]', message, data);
    }
  },
  info: (message: string, data?: any) => {
    if (LOG_LEVELS[process.env.NODE_ENV].includes('info')) {
      console.info('[INFO]', message, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (LOG_LEVELS[process.env.NODE_ENV].includes('warn')) {
      console.warn('[WARN]', message, data);
    }
  },
  error: (message: string, error?: any) => {
    if (LOG_LEVELS[process.env.NODE_ENV].includes('error')) {
      console.error('[ERROR]', message, error);
      // Send to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        // trackError(message, error);
      }
    }
  },
};
```

## Testing for Debugging

### Unit Tests
```typescript
// Test edge cases that commonly cause bugs
describe('sanitizeHTML', () => {
  it('handles null input', () => {
    expect(() => sanitizeHTML(null)).not.toThrow();
  });

  it('handles undefined input', () => {
    expect(() => sanitizeHTML(undefined)).not.toThrow();
  });

  it('handles empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });
});
```

### Integration Tests
```typescript
// Test critical user flows
it('user can complete a lesson', async () => {
  // Login
  // Navigate to lesson
  // Complete lesson
  // Verify points awarded
});
```

## Debugging Resources

### Documentation
- [React DevTools Guide](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Docs](https://developer.chrome.com/docs/devtools/)
- [Supabase Debugging](https://supabase.com/docs/guides/platform/debugging)

### Tools
- React DevTools browser extension
- Redux DevTools (if using Redux)
- React Query DevTools
- Browser performance profiler
- Network inspector

### Best Practices
- Always reproduce before fixing
- Write tests for bugs found
- Document complex fixes
- Keep logging consistent
- Use TypeScript strictly
- Handle errors gracefully

## Conclusion

Effective debugging is a skill that improves with practice. Use these tools and techniques to:
- Identify issues faster
- Understand root causes
- Implement reliable fixes
- Prevent similar issues

Remember: The best debugging is preventing bugs through:
- Strong typing
- Comprehensive testing
- Code reviews
- Clear documentation
- Consistent patterns
