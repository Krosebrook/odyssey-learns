# Enterprise SSO Authentication Architecture
## Odyssey Learns Platform

**Version**: 1.0  
**Date**: 2026-02-09  
**Status**: Approved  
**Related**: [ADR-003: Enterprise SSO Architecture](./adr/ADR-003-enterprise-sso-architecture.md)

---

## Architecture Overview

This document provides visual and textual representations of the Enterprise SSO authentication architecture for Odyssey Learns.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER AUTHENTICATION FLOWS                     │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   End User Device    │
                    │  (Browser/Mobile)    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
     ┌──────────────────┐         ┌──────────────────┐
     │  Email/Password  │         │   SSO Provider   │
     │  (Direct Auth)   │         │   Selection      │
     └────────┬─────────┘         └────────┬─────────┘
              │                             │
              │                    ┌────────┴────────┐
              │                    │                 │
              │                    ▼                 ▼
              │         ┌──────────────────┐  ┌──────────────────┐
              │         │  OAuth Providers │  │  SAML Providers  │
              │         │                  │  │                  │
              │         │ - Azure AD       │  │ - Okta           │
              │         │ - Google         │  │ - Azure SAML     │
              │         │ - GitHub         │  │ - Generic SAML   │
              │         └────────┬─────────┘  └────────┬─────────┘
              │                  │                      │
              │                  │         ┌────────────┴─────────┐
              │                  │         │                      │
              │                  │         ▼                      ▼
              │                  │  ┌─────────────────┐   ┌────────────┐
              │                  │  │  WorkOS (SAML)  │   │   Clever   │
              │                  │  │     Proxy       │   │    SSO     │
              │                  │  └────────┬────────┘   └─────┬──────┘
              │                  │           │                   │
              ▼                  ▼           ▼                   ▼
     ┌────────────────────────────────────────────────────────────────┐
     │                    Supabase Auth (JWT Manager)                 │
     │                                                                 │
     │  - Validate credentials/tokens                                 │
     │  - Generate JWT tokens                                         │
     │  - Session management (60 min auto-refresh)                    │
     │  - Role assignment (parent/child/admin)                        │
     │  - Just-in-time (JIT) user provisioning                        │
     └────────────────────────────┬──────────────────────────────────┘
                                  │
                                  │ JWT with role claims
                                  │
                                  ▼
     ┌────────────────────────────────────────────────────────────────┐
     │               React SPA (Odyssey Learns Frontend)              │
     │                                                                 │
     │  - Auth Context (useAuth hook)                                 │
     │  - Route Guards (RequireAuth, RequireChild, RequireAdmin)      │
     │  - JWT stored in localStorage                                  │
     │  - Automatic token refresh                                     │
     └────────────────────────────┬──────────────────────────────────┘
                                  │
                                  │ Authenticated requests with JWT
                                  │
                                  ▼
     ┌────────────────────────────────────────────────────────────────┐
     │             PostgreSQL Database + Row-Level Security           │
     │                                                                 │
     │  - RLS policies enforce access control                         │
     │  - auth.uid() validates request user                           │
     │  - Tenant isolation (parent → children access only)            │
     │  - Audit logging (security_access_log table)                   │
     └────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow Diagrams

### Flow 1: Email/Password Authentication (Existing)

```
┌─────────┐                                                   ┌──────────────┐
│  User   │                                                   │  Supabase    │
│ Browser │                                                   │   Auth       │
└────┬────┘                                                   └──────┬───────┘
     │                                                               │
     │  1. Enter email + password                                   │
     ├──────────────────────────────────────────────────────────────▶
     │     POST /auth/v1/token                                      │
     │     { email, password }                                      │
     │                                                               │
     │  2. Validate credentials against auth.users table            │
     │                                                          ┌────┴────┐
     │                                                          │Database │
     │                                                          │ Lookup  │
     │                                                          └────┬────┘
     │                                                               │
     │  3. Return JWT + session                                     │
     │◀──────────────────────────────────────────────────────────────
     │     { access_token, refresh_token, user }                   │
     │                                                               │
     │  4. Store JWT in localStorage                                │
     │  5. Set up auto-refresh (60 min)                             │
     │  6. Navigate to dashboard                                    │
     │                                                               │
```

---

### Flow 2: Azure AD OAuth (Phase 1)

```
┌─────────┐              ┌──────────────┐              ┌─────────────┐
│  User   │              │  Supabase    │              │  Azure AD   │
│ Browser │              │   Auth       │              │   (OAuth)   │
└────┬────┘              └──────┬───────┘              └──────┬──────┘
     │                          │                             │
     │  1. Click "Sign in with Microsoft"                    │
     ├─────────────────────────▶                             │
     │     Initiate OAuth flow                               │
     │                          │                             │
     │  2. Redirect to Azure AD                              │
     │                          ├────────────────────────────▶
     │                          │  with client_id, redirect_uri│
     │                          │                             │
     │  3. Redirect to Azure AD login page                   │
     │◀────────────────────────────────────────────────────────
     │     https://login.microsoftonline.com/...             │
     │                                                        │
     │  4. User enters Microsoft credentials                 │
     ├───────────────────────────────────────────────────────▶
     │     email + password (or MFA)                         │
     │                                                        │
     │  5. Azure validates, returns auth code                │
     │◀───────────────────────────────────────────────────────
     │     ?code=abc123&state=xyz                            │
     │                                                        │
     │  6. Redirect back to Odyssey callback                 │
     ├─────────────────────────▶                             │
     │     /auth/callback?code=abc123                        │
     │                          │                             │
     │  7. Exchange code for tokens                          │
     │                          ├────────────────────────────▶
     │                          │  POST /token               │
     │                          │  { code, client_secret }   │
     │                          │                             │
     │  8. Return access_token + id_token                    │
     │                          │◀────────────────────────────
     │                          │  { access_token, id_token } │
     │                          │                             │
     │  9. Extract user profile from id_token                │
     │                          │  (email, name, groups)      │
     │                          │                             │
     │ 10. JIT Provisioning (if first login)                 │
     │                          │  - Check user exists?       │
     │                          │  - Create profile if needed │
     │                          │  - Map role from groups     │
     │                          │                             │
     │ 11. Generate Supabase JWT                             │
     │                          │  with role claims           │
     │                          │                             │
     │ 12. Return JWT to browser                             │
     │◀─────────────────────────                             │
     │     { access_token, user }                            │
     │                                                        │
     │ 13. Store JWT, navigate to dashboard                  │
     │                                                        │
```

---

### Flow 3: SAML via WorkOS (Phase 2)

```
┌─────────┐        ┌──────────┐        ┌─────────┐        ┌──────────┐
│  User   │        │  Odyssey │        │ WorkOS  │        │   Okta   │
│ Browser │        │   App    │        │  (SAML  │        │  (IdP)   │
└────┬────┘        └────┬─────┘        │  Proxy) │        └────┬─────┘
     │                  │               └────┬────┘             │
     │  1. Click "Sign in with [School]"    │                  │
     ├─────────────────▶                    │                  │
     │                  │                    │                  │
     │  2. Redirect to WorkOS SSO endpoint  │                  │
     │                  ├───────────────────▶                  │
     │                  │  /sso/authorize    │                  │
     │                  │  ?connection=okta-school            │
     │                  │                    │                  │
     │  3. WorkOS identifies IdP (Okta)     │                  │
     │                  │                    │                  │
     │  4. Generate SAML AuthnRequest       │                  │
     │                  │                    ├─────────────────▶
     │                  │                    │  SAML Request    │
     │                  │                    │                  │
     │  5. Redirect to Okta login           │                  │
     │◀──────────────────────────────────────────────────────────
     │     https://school.okta.com/...                         │
     │                                                          │
     │  6. User logs in with school credentials                │
     ├─────────────────────────────────────────────────────────▶
     │     email + password (+ MFA if enabled)                 │
     │                                                          │
     │  7. Okta validates, generates SAML Response             │
     │◀─────────────────────────────────────────────────────────
     │     SAML Assertion (XML signed)                         │
     │                                                          │
     │  8. POST SAML Response to WorkOS                        │
     ├──────────────────────▶                                  │
     │     /sso/callback      │                                │
     │                        │                                │
     │  9. WorkOS validates SAML                               │
     │     - Verify signature                                  │
     │     - Check expiration                                  │
     │     - Extract attributes                                │
     │                        │                                │
     │ 10. WorkOS returns auth code                            │
     │◀───────────────────────                                 │
     │     ?code=abc123                                        │
     │                        │                                │
     │ 11. Redirect to Odyssey callback                        │
     ├───────────────────────▶                                 │
     │     /auth/callback?code=abc123                          │
     │                        │                                │
     │ 12. Exchange WorkOS code for profile                    │
     │                        ├────────────────────────────────▶
     │                        │  POST /sso/token              │
     │                        │  { code, client_secret }      │
     │                        │                                │
     │ 13. Return user profile                                 │
     │                        │◀────────────────────────────────
     │                        │  { email, name, attributes }   │
     │                        │                                │
     │ 14. JIT Provisioning                                    │
     │                        │  - Create user if needed       │
     │                        │  - Map role from SAML attrs    │
     │                        │  - Assign to tenant            │
     │                        │                                │
     │ 15. Generate Supabase JWT                               │
     │                        │  with role + tenant claims     │
     │                        │                                │
     │ 16. Return JWT to browser                               │
     │◀───────────────────────                                 │
     │     { access_token, user }                              │
     │                                                          │
     │ 17. Store JWT, navigate to dashboard                    │
     │                                                          │
```

---

## Security Architecture

### Multi-Layer Defense

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Network                              │
│  - HTTPS/TLS 1.3 encryption                                         │
│  - reCAPTCHA v3 (invisible, never blocks)                           │
│  - Rate limiting (per IP, per endpoint)                             │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Layer 2: Authentication                          │
│  - Supabase Auth (JWT tokens)                                       │
│  - OAuth 2.0 / OIDC (Azure AD, Google)                             │
│  - SAML 2.0 (via WorkOS)                                            │
│  - Token expiration: 60 min (auto-refresh)                         │
│  - Password policy: min 8 chars (signup), 6 chars (login)          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Layer 3: Authorization                          │
│  - Role-Based Access Control (RBAC)                                 │
│  - Roles: parent, child, admin                                      │
│  - Row-Level Security (RLS) policies                                │
│  - Tenant isolation (parent → own children only)                    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Layer 4: Application                          │
│  - Input sanitization (XSS prevention)                              │
│  - DOMPurify for user-generated content                             │
│  - Content Security Policy (CSP) headers                            │
│  - Route guards (RequireAuth, RequireChild, RequireAdmin)          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Layer 5: Audit                               │
│  - Security access log (security_access_log table)                  │
│  - Failed login attempts tracking                                   │
│  - Admin action logging                                              │
│  - Sensitive data access monitoring                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Role Mapping

### SAML Attribute → Odyssey Role

```
┌──────────────────────────────────────────────────────────────┐
│              SAML Attributes (from IdP)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  - email: "teacher@school.edu"                              │
│  - name: "Jane Doe"                                         │
│  - groups: ["Teachers", "Grade2Teachers"]                   │
│  - department: "Elementary"                                 │
│  - role: "Teacher"                                          │
│                                                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Mapping Logic
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Role Mapping Rules                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  IF groups contains "Teachers" → role = "parent"            │
│  IF groups contains "Students" → role = "child"             │
│  IF groups contains "Administrators" → role = "admin"       │
│  IF groups contains "Parents" → role = "parent"             │
│                                                              │
│  DEFAULT: role = "parent" (safest fallback)                 │
│                                                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Odyssey User Profile                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  - id: uuid                                                  │
│  - email: "teacher@school.edu"                              │
│  - full_name: "Jane Doe"                                    │
│  - role: "parent"                                           │
│  - tenant_id: "school-district-123"                         │
│  - sso_provider: "okta"                                     │
│  - created_at: timestamp                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified)

### Key Tables

```sql
-- auth.users (Managed by Supabase Auth)
-- Stores authentication credentials

-- profiles (Application user data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
  tenant_id UUID REFERENCES tenants(id),
  sso_provider TEXT, -- 'email', 'azure', 'okta', 'google', etc.
  sso_user_id TEXT, -- Unique ID from SSO provider
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- tenants (Schools/Districts)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Springfield Elementary"
  domain TEXT, -- "springfield.edu" for SSO auto-assignment
  sso_config JSONB, -- SAML metadata, connection IDs
  created_at TIMESTAMP DEFAULT NOW()
);

-- children (Student accounts)
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  age INTEGER,
  grade_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Parents can only see their own children
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (parent_id = auth.uid());

-- security_access_log (Audit trail)
CREATE TABLE security_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'sso_login', 'admin_action', etc.
  resource TEXT, -- 'user:123', 'lesson:456'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Only admins can view logs
CREATE POLICY "Admins can view logs"
  ON security_access_log FOR SELECT
  USING (is_admin(auth.uid()));
```

---

## Token Flow

### JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "aud": "authenticated",
    "exp": 1707486000,
    "iat": 1707482400,
    "iss": "https://your-project.supabase.co/auth/v1",
    "sub": "user-uuid-here",
    "email": "user@example.com",
    "phone": "",
    "app_metadata": {
      "provider": "azure",
      "providers": ["azure"]
    },
    "user_metadata": {
      "full_name": "Jane Doe",
      "role": "parent",
      "tenant_id": "tenant-uuid"
    },
    "role": "authenticated",
    "aal": "aal1",
    "amr": [
      {
        "method": "oauth",
        "timestamp": 1707482400
      }
    ],
    "session_id": "session-uuid"
  },
  "signature": "..."
}
```

---

## Implementation Checklist

### Phase 1: Azure AD OAuth (Month 1-2)
- [ ] Enable Azure AD provider in Supabase dashboard
- [ ] Register app in Azure AD portal
- [ ] Configure redirect URIs
- [ ] Add "Sign in with Microsoft" button
- [ ] Implement user attribute mapping
- [ ] Test with internal accounts
- [ ] Pilot with 1-2 schools
- [ ] Monitor success rate

### Phase 2: WorkOS SAML (Month 3-4)
- [ ] Sign up for WorkOS account
- [ ] Configure WorkOS ↔ Supabase integration
- [ ] Create SSO admin portal (/admin/sso-config)
- [ ] Test with Okta sandbox
- [ ] Support generic SAML providers
- [ ] Document SSO setup for customers

### Phase 3: Advanced Features (Month 5-6)
- [ ] Just-in-time (JIT) user provisioning
- [ ] SCIM for user lifecycle management
- [ ] Clever SSO integration
- [ ] Directory sync (roster import)
- [ ] MFA enforcement for admins
- [ ] Advanced audit logging

---

## Monitoring & Alerting

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| SSO login success rate | > 99% | < 95% |
| SSO login latency (p95) | < 3s | > 5s |
| Token validation errors | < 0.1% | > 1% |
| JIT provisioning failures | < 1% | > 5% |
| OAuth token refresh failures | < 0.5% | > 2% |

### Dashboards

**Auth Health Dashboard**:
- Login attempts by method (email, Azure, Okta, etc.)
- Success/failure rates
- Average latency by auth method
- JIT provisioning statistics
- Active sessions

**Security Dashboard**:
- Failed login attempts by IP
- Unusual access patterns
- Admin actions log
- SSO certificate expiration dates
- SAML assertion validation errors

---

## Troubleshooting Guide

### Issue: Azure AD OAuth fails

**Symptoms**: "Invalid redirect URI" or "Unauthorized client"

**Solutions**:
1. Verify redirect URI matches exactly in Azure AD app registration
2. Check client ID and tenant ID are correct
3. Ensure user has permission to consent to app
4. Check Azure AD app is not expired

---

### Issue: SAML assertion invalid

**Symptoms**: "Invalid signature" or "Assertion expired"

**Solutions**:
1. Verify SAML certificate is not expired (check WorkOS dashboard)
2. Check clock sync between WorkOS and IdP (time skew < 5 min)
3. Validate SAML metadata matches IdP configuration
4. Check SAML assertion structure (NameID format, attributes)

---

### Issue: JIT provisioning creates duplicate users

**Symptoms**: Multiple profiles for same email

**Solutions**:
1. Check uniqueness constraint on email field
2. Use `email` as primary key for user lookup (not SSO ID)
3. Implement idempotent user creation (check before insert)
4. Log provisioning attempts for debugging

---

## References

- [ADR-003: Enterprise SSO Architecture](./adr/ADR-003-enterprise-sso-architecture.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [WorkOS SSO Documentation](https://workos.com/docs/sso)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [SAML 2.0 Technical Overview](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

---

**Document Status**: Approved  
**Implementation Status**: Planning (Phase 1 starts Month 1)  
**Next Review**: After Phase 1 completion (Month 2)

---

_Last updated: 2026-02-09_
