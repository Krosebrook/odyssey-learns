# Authentication System Documentation

## Overview

Inner Odyssey uses Supabase Auth with email/password authentication and optional Google OAuth. The system implements a zero-trust security model with graceful degradation for reCAPTCHA.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend                                                       │
│  ├── useAuth Hook (src/hooks/useAuth.tsx)                      │
│  │   ├── Manages user, session, isAdmin state                  │
│  │   ├── signUp, signIn, signOut methods                       │
│  │   └── Auto-detects admin role via RPC                       │
│  │                                                             │
│  ├── Auth Page (src/pages/Auth.tsx)                            │
│  │   ├── Consolidated login/signup with tabs                   │
│  │   └── Redirects based on user role                          │
│  │                                                             │
│  └── Route Guards                                               │
│      ├── RequireAuth - Blocks unauthenticated                  │
│      ├── RequireChild - Requires child selection               │
│      └── RequireAdmin - Requires admin role                    │
│                                                                 │
│  Backend                                                        │
│  ├── Supabase Auth (managed)                                   │
│  ├── verify-recaptcha Edge Function (graceful)                 │
│  ├── check_rate_limit RPC (server-side)                        │
│  └── user_roles Table (RBAC)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Flows

### Login Flow

1. User navigates to `/auth`
2. Enters email and password
3. Form validates with Zod schema
4. Server-side rate limit check via `check_rate_limit` RPC
5. reCAPTCHA executed (graceful - never blocks)
6. `supabase.auth.signInWithPassword()` called
7. On success:
   - `useAuth` hook updates state
   - Auth page detects user and checks admin status
   - Redirects to `/admin` if admin, `/parent` otherwise
8. On failure: Shows "Invalid email or password"

### Signup Flow

1. User navigates to `/auth` and clicks "Sign Up" tab
2. Fills full name, email, password, confirm password
3. Form validates with Zod schema
4. Server-side rate limit check
5. reCAPTCHA executed (graceful)
6. `supabase.auth.signUp()` called with:
   - Email redirect to `/parent-setup`
   - User metadata: `full_name`
7. On success:
   - Profile created via database trigger
   - User role assigned as 'parent'
   - Redirects to `/parent-setup`

### Session Persistence

```typescript
// useAuth hook handles session persistence
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check admin status when user changes
      if (session?.user) {
        setTimeout(() => checkAdminStatus(), 0);
      }
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

## Role-Based Access Control (RBAC)

### Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `parent` | Default role for all users | Own children data |
| `admin` | System administrators | All data + admin pages |
| `moderator` | Content moderators | Lessons + reviews |

### Checking Roles

```typescript
// In database functions
SELECT has_role(auth.uid(), 'admin'::app_role);

// In frontend
const { isAdmin } = useAuth();

// In RLS policies
has_role(auth.uid(), 'admin'::app_role)
```

### Database Function

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## Route Guards

### RequireAuth

Blocks access for unauthenticated users:

```tsx
// Usage in App.tsx
<Route path="/parent" element={<RequireAuth><ParentDashboard /></RequireAuth>} />
```

### RequireChild

Requires a child to be selected:

```tsx
<Route path="/lessons" element={
  <RequireAuth>
    <RequireChild>
      <Lessons />
    </RequireChild>
  </RequireAuth>
} />
```

### RequireAdmin

Requires admin role:

```tsx
<Route path="/admin" element={
  <RequireAdmin>
    <AdminDashboard />
  </RequireAdmin>
} />
```

## reCAPTCHA Integration

### Philosophy: Graceful Degradation

reCAPTCHA is **soft enforcement** - it never blocks legitimate users:

1. If reCAPTCHA fails to load → Continue without it
2. If verification fails → Log and continue
3. If score is low → Mark as suspicious but allow
4. If key mismatch → Fallback and log

### Edge Function Responses

All responses return `valid: true` to avoid blocking auth:

```json
// Normal verification
{ "valid": true, "score": 0.9, "action": "login" }

// Suspicious but allowed
{ "valid": true, "score": 0.2, "suspicious": true }

// Fallback mode
{ "valid": true, "fallback": true, "reason": "Key mismatch" }
```

## Security Features

### Server-Side Rate Limiting

All rate limits enforced via database RPC:

```typescript
const rateLimit = await checkServerRateLimit('login', 5, 15);
if (!rateLimit.allowed) {
  // Show error with retry time
}
```

| Endpoint | Max Requests | Window |
|----------|--------------|--------|
| login | 5 | 15 min |
| signup | 3 | 15 min |
| password_reset | 5 | 60 min |
| custom_lesson | 3 | 1440 min (24h) |

### Failed Auth Tracking

Failed login attempts logged for security monitoring:

```sql
INSERT INTO failed_auth_attempts (
  email, ip_address, user_agent, failure_reason
) VALUES (...);
```

### Input Validation

All auth inputs validated with Zod:

```typescript
const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA site key (optional) |

### Supabase Secrets

| Secret | Description |
|--------|-------------|
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA secret key |

### Auth Settings

Via Supabase Dashboard or Lovable Cloud:
- **Auto-confirm email:** Enabled (for development)
- **Email OTP:** Enabled
- **Password recovery:** Enabled

## Troubleshooting

### Login Not Working

1. Check browser console for errors
2. Verify Supabase URL and keys
3. Check `auth.users` table for user
4. Verify `profiles` and `user_roles` tables

### Admin Access Denied

1. Verify user has `admin` role in `user_roles`
2. Check `expires_at` is null or future
3. Test `is_current_user_admin()` RPC

### Session Not Persisting

1. Check localStorage for `sb-*` keys
2. Verify no `supabase.auth.signOut()` on page load
3. Check for cookie issues (third-party blocking)

### Rate Limit Issues

1. Check `api_rate_limits` table
2. Wait for window to expire
3. Increase limits if needed for production

## Testing

### Unit Tests

```bash
npm run test -- src/hooks/__tests__/useAuth.test.tsx
npm run test -- src/components/auth/__tests__/
```

### E2E Tests

```bash
npx playwright test e2e/auth-flows.spec.ts
```

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials  
- [ ] Signup new account
- [ ] Signup with existing email
- [ ] Password reset flow
- [ ] Session persistence across reload
- [ ] Logout clears session
- [ ] Admin redirect works
- [ ] Parent redirect works

---

**Last Updated:** 2025-12-17
**Maintainers:** Inner Odyssey Development Team
