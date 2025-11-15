# Troubleshooting Guide

## Table of Contents
- [Common Issues](#common-issues)
- [Authentication Problems](#authentication-problems)
- [Database Issues](#database-issues)
- [Edge Function Errors](#edge-function-errors)
- [UI/Performance Issues](#ui-performance-issues)
- [Security & RLS Errors](#security--rls-errors)
- [Debugging Tools](#debugging-tools)
- [Getting Help](#getting-help)

---

## Common Issues

### "Child not found" or Validation Errors

**Symptom:** Routes fail with validation errors or "child not found" messages.

**Common Causes:**
1. Missing child ID in localStorage after session
2. Parent accessing child route without proper child selection
3. Child deleted but session still references old ID

**Solution:**
```typescript
// Check useValidatedChild hook usage
const { childId, childData, isLoading } = useValidatedChild();

// Ensure ChildSelector component is rendered first
<ChildSelector onSelect={(id) => navigate(`/child/${id}/dashboard`)} />

// Clear invalid child from localStorage
localStorage.removeItem('selectedChildId');
```

**Prevention:**
- Always use `useValidatedChild()` in child routes
- Redirect to `/parent-setup` if no children exist
- Add error boundaries around child-dependent components

---

### Lesson Generation Fails

**Symptom:** Custom lesson generation returns errors or times out.

**Common Causes:**
1. Rate limit exceeded (5 lessons per day default)
2. Missing Gemini API key in secrets
3. Network timeout (edge function > 30s)
4. Invalid lesson parameters (grade level mismatch)

**Solution:**
```bash
# Check edge function logs
View Backend → Edge Functions → generate-custom-lesson

# Common error patterns:
# "Rate limit exceeded" → Check daily_lesson_quota table
# "API key invalid" → Verify GEMINI_API_KEY secret
# "Timeout" → Check prompt complexity, reduce content length

# Manual quota check
SELECT * FROM daily_lesson_quota 
WHERE child_id = '<child-uuid>' 
AND quota_date = CURRENT_DATE;
```

**Quick Fixes:**
- Grant bonus lessons via parent dashboard
- Verify secrets are configured (not empty strings)
- Reduce lesson complexity (shorter descriptions)
- Check child's grade level matches request

---

### Points Not Updating

**Symptom:** Child completes activity but points don't increment.

**Common Causes:**
1. Transaction rollback due to constraint violation
2. RLS policy blocking update
3. Race condition (multiple tabs open)

**Solution:**
```sql
-- Check recent user_progress entries
SELECT * FROM user_progress 
WHERE child_id = '<child-uuid>' 
ORDER BY created_at DESC 
LIMIT 10;

-- Verify children table total_points
SELECT id, name, total_points 
FROM children 
WHERE id = '<child-uuid>';

-- Manual point update (admin only)
UPDATE children 
SET total_points = total_points + 50 
WHERE id = '<child-uuid>';
```

**Prevention:**
- Use optimistic updates with React Query
- Add retry logic for failed point updates
- Log all point transactions for audit trail

---

## Authentication Problems

### User Cannot Sign Up

**Symptom:** Signup form submits but user not created.

**Checklist:**
1. ✅ Auto-confirm email enabled in Cloud → Auth settings?
2. ✅ Email provider configured (SMTP or Supabase defaults)?
3. ✅ Password meets requirements (8+ chars)?
4. ✅ No existing user with same email?

**Debug Steps:**
```typescript
// Check signup response
const { data, error } = await supabase.auth.signUp({
  email, password, 
  options: { data: { full_name } }
});
console.log('Signup error:', error);

// Common errors:
// "User already registered" → Email conflict
// "Password too weak" → Add uppercase/number
// "Email not confirmed" → Auto-confirm disabled
```

**Solution:**
```bash
# Enable auto-confirm (critical for beta testing)
View Backend → Settings → Auth → 
  ☑ Auto-confirm email signups
  
# Check auth.users table
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'user@example.com';
```

---

### Session Expires Immediately

**Symptom:** User logs in but gets logged out on refresh.

**Common Causes:**
1. JWT token expired (default 1 hour)
2. localStorage blocked by browser
3. CORS issues with auth endpoints

**Solution:**
```typescript
// Check Supabase client config
export const supabase = createClient(url, key, {
  auth: {
    storage: localStorage, // Ensure this is set
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Verify localStorage access
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage blocked:', e);
  // Fallback to sessionStorage or in-memory storage
}
```

**Prevention:**
- Set longer JWT expiry in auth settings (up to 1 week)
- Add session refresh before expiry
- Handle storage errors gracefully

---

### RLS Policy Blocking Access

**Symptom:** `new row violates row-level security policy` error.

**Debug Process:**
1. Identify which table is blocking
2. Check if user is authenticated (`auth.uid()` exists)
3. Verify policy conditions match user's data

**Solution:**
```sql
-- Test policy manually (replace <user-uuid>)
SET request.jwt.claim.sub = '<user-uuid>';

-- Try the failing query
INSERT INTO children (parent_id, name, grade_level) 
VALUES ('<user-uuid>', 'Test Child', 1);

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'children';
```

**Common Policy Fixes:**
```sql
-- Parent can insert their own children
CREATE POLICY "Parents can create children"
ON children FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Child can read their own data
CREATE POLICY "Children can read own data"
ON user_progress FOR SELECT
USING (child_id IN (
  SELECT id FROM children WHERE parent_id = auth.uid()
));
```

---

## Database Issues

### Migration Fails to Apply

**Symptom:** Database migration tool returns error.

**Common Errors:**

**1. Column Already Exists**
```sql
-- Error: column "new_column" already exists
-- Solution: Check if column exists first
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS new_column TEXT;
```

**2. Foreign Key Violation**
```sql
-- Error: violates foreign key constraint
-- Solution: Check referenced data exists
-- Example: Can't delete parent if children exist

-- Safe deletion with cascade
ALTER TABLE children
DROP CONSTRAINT children_parent_id_fkey,
ADD CONSTRAINT children_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
```

**3. Type Mismatch**
```sql
-- Error: column "grade_level" is of type integer but expression is of type text
-- Solution: Cast explicitly
UPDATE children 
SET grade_level = grade_level::TEXT::INTEGER;
```

**Prevention:**
- Test migrations in staging first
- Use `IF EXISTS` / `IF NOT EXISTS` clauses
- Add data validation before schema changes

---

### Slow Query Performance

**Symptom:** Dashboard takes 5+ seconds to load.

**Debug Steps:**
```sql
-- Enable query timing
EXPLAIN ANALYZE
SELECT * FROM user_progress 
WHERE child_id = '<uuid>' 
ORDER BY created_at DESC;

-- Check missing indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Identify slow queries (admin access needed)
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Common Fixes:**
```sql
-- Add index on frequently filtered columns
CREATE INDEX idx_user_progress_child_created 
ON user_progress(child_id, created_at DESC);

-- Add index for JOIN operations
CREATE INDEX idx_children_parent 
ON children(parent_id);

-- Add composite index for complex queries
CREATE INDEX idx_lessons_grade_subject_active 
ON lessons(grade_level, subject, is_active) 
WHERE is_active = true;
```

**Query Optimization:**
```typescript
// ❌ BAD: Fetches all data then filters in JS
const allLessons = await supabase.from('lessons').select('*');
const filtered = allLessons.filter(l => l.grade_level === 2);

// ✅ GOOD: Filter in database
const { data } = await supabase
  .from('lessons')
  .select('*')
  .eq('grade_level', 2)
  .eq('is_active', true)
  .limit(20);
```

---

### Database Connection Issues

**Symptom:** "Failed to fetch" or connection timeout errors.

**Checklist:**
1. ✅ Verify Supabase project is active (not paused)
2. ✅ Check VITE_SUPABASE_URL in .env (auto-generated)
3. ✅ Verify network connectivity
4. ✅ Check rate limits not exceeded

**Solution:**
```typescript
// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .single();
    
    if (error) throw error;
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
};
```

---

## Edge Function Errors

### Function Returns 500 Error

**Symptom:** Edge function invocation fails with 500 Internal Server Error.

**Debug Steps:**
1. Check function logs in Backend → Edge Functions
2. Look for uncaught exceptions
3. Verify all required secrets are set

**Common Errors:**

**Missing Error Handling**
```typescript
// ❌ BAD: Unhandled promise rejection
const response = await fetch(externalAPI);
const data = await response.json();

// ✅ GOOD: Proper error handling
try {
  const response = await fetch(externalAPI);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
} catch (error) {
  console.error('Function error:', error);
  return new Response(
    JSON.stringify({ error: error.message }), 
    { status: 500, headers: corsHeaders }
  );
}
```

**Missing CORS Headers**
```typescript
// ❌ BAD: CORS errors in browser
return new Response(JSON.stringify(data));

// ✅ GOOD: Include CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

---

### Function Timeout (>30s)

**Symptom:** Edge function never returns, times out after 30 seconds.

**Common Causes:**
1. Infinite loop in code
2. External API call hangs
3. Database query never completes

**Solution:**
```typescript
// Add timeout to external calls
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000); // 25s max

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { ... }
  });
  clearTimeout(timeout);
  // Process response...
} catch (error) {
  if (error.name === 'AbortError') {
    return new Response(
      JSON.stringify({ error: 'Request timeout' }), 
      { status: 504, headers: corsHeaders }
    );
  }
  throw error;
}
```

**Prevention:**
- Set timeouts on all external API calls (< 25s)
- Optimize database queries (add indexes)
- Break long operations into smaller chunks
- Use async/await properly (avoid blocking)

---

### Cannot Invoke Function from Client

**Symptom:** `supabase.functions.invoke()` returns 401 or 403.

**Common Causes:**
1. Function requires JWT but user not authenticated
2. Function marked as `verify_jwt = true` in config.toml
3. Missing authorization header

**Solution:**
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error('User not authenticated');
  // Redirect to login
}

// Invoke with proper auth
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { param1: 'value' },
  headers: {
    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  }
});
```

**Make Function Public (if needed):**
```toml
# supabase/config.toml
[functions.my-public-function]
verify_jwt = false  # Allow unauthenticated access
```

---

## UI/Performance Issues

### Page Loads Slowly (>3s)

**Symptom:** White screen or loading spinner for 3+ seconds.

**Debug Steps:**
```typescript
// Measure component render time
import { measureAsync } from '@/lib/performance';

const MyComponent = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      return measureAsync('fetch-lessons', async () => {
        const { data } = await supabase.from('lessons').select('*');
        return data;
      });
    }
  });
  
  // Check performance metrics
  useEffect(() => {
    console.log('Metrics:', getMetricsSummary());
  }, []);
};
```

**Common Fixes:**

**1. Lazy Load Heavy Components**
```typescript
// ❌ BAD: Loads everything upfront
import { HeavyChart } from '@/components/HeavyChart';

// ✅ GOOD: Lazy load with Suspense
const HeavyChart = lazy(() => import('@/components/HeavyChart'));

<Suspense fallback={<Skeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

**2. Optimize Images**
```typescript
// ❌ BAD: Large unoptimized images
<img src="/hero.jpg" alt="Hero" />

// ✅ GOOD: Lazy loading + responsive
<img 
  src="/hero.jpg" 
  alt="Hero" 
  loading="lazy"
  srcSet="/hero-400.jpg 400w, /hero-800.jpg 800w"
  sizes="(max-width: 640px) 400px, 800px"
/>
```

**3. Reduce Bundle Size**
```bash
# Check bundle size
npm run build
# Look for large chunks in dist/

# Common culprits:
# - Unused dependencies (remove)
# - Large icon libraries (use tree-shaking)
# - Duplicate code (extract to shared utils)
```

---

### Animations Janky or Stuttering

**Symptom:** Animations lag, especially on mobile.

**Common Causes:**
1. Animating non-GPU properties (width, height, top, left)
2. Too many elements animating simultaneously
3. Heavy JS execution during animation

**Solution:**
```typescript
// ❌ BAD: Animates layout properties
const variants = {
  open: { width: '300px', height: '200px' },
  closed: { width: '0px', height: '0px' }
};

// ✅ GOOD: Animates transform/opacity (GPU-accelerated)
const variants = {
  open: { scale: 1, opacity: 1 },
  closed: { scale: 0.5, opacity: 0 }
};

// Use will-change sparingly
<motion.div
  style={{ willChange: 'transform' }}
  animate={variants}
/>
```

**Reduce Animation Complexity:**
```typescript
// Disable animations on low-end devices
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : variants}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

---

### React Query Infinite Refetches

**Symptom:** Network tab shows endless repeated requests.

**Common Causes:**
1. Query key changes on every render
2. `refetchOnWindowFocus` enabled for expensive queries
3. Dependent queries triggering cascade

**Solution:**
```typescript
// ❌ BAD: Query key changes on every render (new object reference)
useQuery({
  queryKey: ['lessons', { grade: gradeLevel }], // New object each render
  queryFn: fetchLessons
});

// ✅ GOOD: Stable query key
useQuery({
  queryKey: ['lessons', gradeLevel], // Primitive value
  queryFn: fetchLessons,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false // Disable for expensive queries
});
```

---

## Security & RLS Errors

### Data Visible Across Accounts

**Symptom:** Parent sees another parent's children or data.

**CRITICAL:** This is a security breach. Immediate action required.

**Investigation:**
```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Verify policies exist
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Fix RLS Issues:**
```sql
-- Enable RLS on exposed table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Add protective policy
CREATE POLICY "Parents see only their children"
ON children FOR SELECT
USING (parent_id = auth.uid());

-- Test isolation
SET request.jwt.claim.sub = '<parent-1-uuid>';
SELECT * FROM children; -- Should only show parent-1's children

SET request.jwt.claim.sub = '<parent-2-uuid>';
SELECT * FROM children; -- Should only show parent-2's children
```

**Emergency Response:**
1. Document which data was exposed
2. Enable RLS immediately
3. Audit logs for unauthorized access
4. Notify affected users if breach confirmed

---

### Emotion Logs Unencrypted

**Symptom:** Sensitive emotion data visible in plaintext.

**Check Encryption:**
```sql
-- Verify encrypted columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'emotion_logs' 
AND column_name LIKE '%encrypted%';

-- Check if data is encrypted (should be bytea, not text)
SELECT 
  id,
  trigger_encrypted IS NOT NULL as has_encrypted_trigger,
  reflection_notes_encrypted IS NOT NULL as has_encrypted_notes
FROM emotion_logs 
LIMIT 5;
```

**Fix Encryption:**
```typescript
// Use encryption utility
import { encryptEmotionField, decryptEmotionField } from '@/lib/emotionEncryption';

// Store encrypted
const encryptedTrigger = await encryptEmotionField(trigger);
await supabase.from('emotion_logs').insert({
  child_id,
  emotion_type,
  trigger_encrypted: encryptedTrigger,
  // ... other fields
});

// Retrieve and decrypt
const { data } = await supabase.from('emotion_logs').select('*');
const decryptedTrigger = await decryptEmotionField(data.trigger_encrypted);
```

---

## Debugging Tools

### Browser DevTools

**Console Errors:**
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check for common errors
// - CORS errors → Check edge function headers
// - 401 Unauthorized → Check auth token
// - 404 Not Found → Check route/API endpoint
// - Type errors → Check TypeScript interfaces
```

**Network Tab:**
```
Filter by:
- XHR/Fetch → API calls to Supabase
- Status code → 4xx (client errors), 5xx (server errors)
- Slow requests → >1s response time

Check headers:
- Authorization → Bearer token present?
- Content-Type → application/json?
- CORS headers → Access-Control-Allow-Origin?
```

**React DevTools:**
```
Components tab:
- Find component in tree
- Inspect props/state
- Check hooks (useQuery, useAuth)

Profiler tab:
- Record interaction
- Find slow renders (>16ms)
- Optimize heavy components
```

---

### Supabase Debugging

**Edge Function Logs:**
```bash
# Access via: View Backend → Edge Functions → [function-name] → Logs

# Common log patterns:
[INFO] Function invoked → Request received
[ERROR] API call failed → External API issue
[WARN] Rate limit approaching → Throttle requests

# Add structured logging:
console.log(JSON.stringify({
  level: 'info',
  message: 'Lesson generated',
  metadata: { childId, lessonId, duration: 1234 }
}));
```

**Database Logs:**
```sql
-- Query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### Custom Debugging Utilities

**Performance Monitoring:**
```typescript
import { getMetricsSummary, clearMetrics } from '@/lib/performance';

// Check slow operations
const metrics = getMetricsSummary();
console.table(metrics); // Pretty print

// Example output:
// ┌─────────────────┬───────┬─────────┬──────┬──────┐
// │ name            │ count │ average │ min  │ max  │
// ├─────────────────┼───────┼─────────┼──────┼──────┤
// │ fetch-lessons   │ 12    │ 456ms   │ 320  │ 890  │
// │ render-dashboard│ 5     │ 23ms    │ 18   │ 34   │
// └─────────────────┴───────┴─────────┴──────┴──────┘
```

**Audit Logging:**
```typescript
import { auditLog } from '@/lib/auditLogger';

// Track sensitive operations
await auditLog({
  userId: user.id,
  action: 'view_child_emotions',
  entityType: 'emotion_logs',
  entityId: emotionLogId,
  metadata: { childId, accessedFrom: 'parent-dashboard' }
});
```

**Error Handler:**
```typescript
import { handleError, ErrorSeverity } from '@/lib/errorHandler';

try {
  // Risky operation
} catch (error) {
  handleError(error, {
    context: 'LessonGeneration',
    severity: ErrorSeverity.HIGH,
    userId: user.id,
    metadata: { childId, prompt }
  });
}
```

---

## Getting Help

### Before Asking for Help

**Checklist:**
1. ✅ Checked this troubleshooting guide
2. ✅ Reviewed relevant documentation (ARCHITECTURE, DATABASE_SCHEMA, etc.)
3. ✅ Searched existing issues in Discord/GitHub
4. ✅ Tested in incognito mode (rules out browser cache)
5. ✅ Verified issue persists across browsers/devices

**Gather Debug Information:**
```typescript
// Generate debug report
const debugReport = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  viewport: { width: window.innerWidth, height: window.innerHeight },
  auth: {
    isAuthenticated: !!(await supabase.auth.getUser()).data.user,
    sessionExpiry: (await supabase.auth.getSession()).data.session?.expires_at
  },
  environment: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID
  },
  performance: getMetricsSummary(),
  errors: /* last 10 console errors */,
};

console.log('Debug report:', JSON.stringify(debugReport, null, 2));
// Copy and share this report when asking for help
```

---

### Support Channels

**Internal Team:**
- **Slack/Discord:** #inner-odyssey-support
- **Issue Tracker:** GitHub Issues (private repo)
- **Code Review:** Tag `@senior-dev` in PR for complex issues

**Documentation:**
- `docs/ARCHITECTURE.md` → System overview
- `docs/DATABASE_SCHEMA.md` → Database structure
- `docs/EDGE_FUNCTIONS.md` → Backend functions
- `docs/SECURITY.md` → Security best practices

**External Resources:**
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

## Emergency Procedures

### Data Breach Response

**If sensitive data exposed:**
1. **Immediate:** Enable RLS on affected table
2. **Assess:** Query `security_access_log` for unauthorized access
3. **Contain:** Revoke access tokens if needed
4. **Document:** Record timeline, scope, affected users
5. **Notify:** Follow COPPA/FERPA breach notification requirements

```sql
-- Check access logs for suspicious activity
SELECT * FROM security_access_log
WHERE accessed_table = 'emotion_logs'
AND success = true
ORDER BY accessed_at DESC;
```

---

### Database Corruption

**If database enters inconsistent state:**
1. **Stop writes:** Pause edge functions processing updates
2. **Assess damage:** Check referential integrity
3. **Restore:** Rollback to last known good state
4. **Prevent:** Add database constraints/triggers

```sql
-- Check referential integrity
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' -- Foreign keys
AND connamespace = 'public'::regnamespace;

-- Find orphaned records
SELECT c.id FROM children c
LEFT JOIN profiles p ON c.parent_id = p.id
WHERE p.id IS NULL;
```

---

### Production Outage

**If app becomes completely unavailable:**
1. **Check status:** View Backend → Monitor for service disruptions
2. **Verify DNS:** Ensure domain resolves correctly
3. **Check quotas:** Database connections, API rate limits
4. **Rollback:** Deploy last stable version if recent change caused issue

```bash
# Check recent deployments
# (via Cloud UI or Git history)

# Rollback steps:
1. Go to Version History
2. Find last working commit
3. Click "Deploy this version"
4. Monitor for recovery
```

---

**Last Updated:** 2025-11-15  
**Maintainer:** Inner Odyssey DevOps Team  
**Review Frequency:** Monthly
