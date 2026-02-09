# ADR-003: Enterprise SSO Architecture

**Status**: Accepted  
**Date**: 2026-02-09  
**Decision Makers**: Platform Architecture Team, Security Team  
**Consulted**: Product Team, Customer Success  
**Informed**: All Engineering Teams

## Context

Odyssey Learns currently uses **Supabase Auth** with email/password authentication. As we target enterprise K-12 schools and districts, there's increasing demand for Single Sign-On (SSO) integration with:

1. **Azure Active Directory (Azure AD / Microsoft Entra ID)**: Used by 80%+ of K-12 schools
2. **Google Workspace for Education**: Common in K-12 (covered by current Supabase OAuth)
3. **Okta**: Used by larger districts and education management companies
4. **Clever**: Education-specific SSO (10M+ students)

**Current Authentication Architecture**:
- Supabase Auth (JWT-based)
- Email/password + Google OAuth (already supported)
- Role-based access control (parent, child, admin)
- Row-Level Security (RLS) at database level

**Enterprise Customer Requirements**:
- "We need Azure AD SSO - our teachers can't manage separate passwords"
- "SAML 2.0 support is required for district security policy"
- "Student data must stay within our identity provider"
- "We need just-in-time (JIT) user provisioning"

**Business Impact**:
- 5+ enterprise deals blocked by lack of SSO ($50k-200k ARR each)
- Compliance requirement for FERPA, COPPA at scale
- Competitive disadvantage vs Canvas, Schoology

**Technical Constraints**:
- Must maintain existing email/password flow (small schools, parents)
- Must preserve Row-Level Security architecture
- Cannot break current authentication for 1000+ active users
- Budget: $500/month for SSO infrastructure

## Decision

We will implement **Multi-Provider SSO Architecture** using a hybrid approach:

### 1. Authentication Strategy

#### Tier 1: Built-in OAuth (Low Effort)
Use Supabase's native OAuth support:
- ✅ Google (already implemented)
- 🔧 Microsoft Azure AD (Supabase native support)
- 🔧 GitHub (for developer accounts)

#### Tier 2: SAML Proxy (Medium Effort)
For SAML-only providers, use **WorkOS** as SSO proxy:
- Azure AD SAML
- Okta SAML
- Clever SSO
- Generic SAML providers

#### Tier 3: Custom Integration (High Effort)
For education-specific needs:
- Clever Library API integration
- ClassLink rostering
- Custom OIDC providers

### 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Odyssey Learns Frontend                 │
│                   (React SPA + Auth Context)                │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │                            │
     ┌───────▼────────┐          ┌────────▼─────────┐
     │  Email/Password│          │   SSO Providers   │
     │   (Supabase)   │          │                   │
     └───────┬────────┘          │  - Azure AD (OAuth)│
             │                   │  - Google (OAuth) │
             │                   │  - WorkOS (SAML)  │
             │                   │  - Clever         │
             │                   └────────┬──────────┘
             │                            │
             │                            │
     ┌───────▼────────────────────────────▼──────────┐
     │         Supabase Auth (JWT Manager)           │
     │   - Generate JWT tokens                       │
     │   - Session management                        │
     │   - Role assignment (parent/child/admin)      │
     └───────┬───────────────────────────────────────┘
             │
             │
     ┌───────▼────────────────────────────────────────┐
     │         PostgreSQL + RLS                       │
     │   - User profiles (linked to auth.users)       │
     │   - Children data                              │
     │   - Progress tracking                          │
     │   - RLS policies enforce access control        │
     └────────────────────────────────────────────────┘
```

### 3. Implementation Phases

#### Phase 1: Azure AD OAuth (Month 1)
- Enable Azure AD in Supabase Auth
- Add "Sign in with Microsoft" button
- Map Azure AD attributes to user profile
- Test with pilot school district
- **Cost**: $0 (Supabase native)

#### Phase 2: SAML via WorkOS (Months 2-3)
- Sign up for WorkOS ($299/month for SSO)
- Implement WorkOS → Supabase integration
- Support Okta, Azure AD SAML, Clever
- Create admin portal for SSO configuration
- **Cost**: $299/month

#### Phase 3: Advanced Features (Months 4-6)
- Just-in-time (JIT) user provisioning
- SCIM for user lifecycle management
- Directory sync (import roster from Azure AD)
- Multi-factor authentication (MFA) enforcement
- Audit logging for enterprise compliance

### 4. User Experience Flows

#### Enterprise User Login (SSO)
```
1. User lands on https://innerodyssey.lovable.app
2. Clicks "Sign in with Microsoft" or "Sign in with [School Name]"
3. Redirects to Azure AD / Okta / Clever
4. User authenticates with school credentials
5. Redirect back with OAuth code / SAML assertion
6. Backend exchanges for Supabase JWT
7. User lands on dashboard (parent or child, based on role mapping)
```

#### First-Time SSO User (JIT Provisioning)
```
1-5. Same as above
6. Backend checks: User exists in database?
   - NO: Create user profile with data from SSO provider
         - Email, name, role from SAML attributes
         - Assign to correct tenant (school/district)
         - Create parent profile (teachers/parents)
   - YES: Update profile with latest SSO data
7. Generate Supabase JWT with role claims
8. User lands on onboarding or dashboard
```

#### Fallback for Non-Enterprise Users
```
1. User clicks "Sign in with Email"
2. Enter email + password (existing flow)
3. Supabase validates credentials
4. Generate JWT and proceed to dashboard
```

### 5. Security Considerations

#### OAuth/SAML Token Validation
```typescript
// src/lib/auth/ssoProvider.ts
export async function validateSSOToken(
  provider: 'azure' | 'okta' | 'clever',
  token: string
): Promise<SSOUser> {
  // Verify token signature
  // Check expiration
  // Validate issuer (prevent token substitution)
  // Extract user claims
}
```

#### Role Mapping from SSO
```typescript
// Map Azure AD groups to Odyssey roles
const roleMapping = {
  'Teachers': 'parent', // Teachers manage children (students)
  'Students': 'child',
  'Administrators': 'admin',
  'Parents': 'parent'
};
```

#### Tenant Isolation
- Each school/district is a "tenant"
- Use `tenant_id` in RLS policies
- Prevent cross-tenant data access
- SSO users auto-assigned to tenant based on domain

### 6. Configuration Management

#### SSO Configuration UI (Admin Portal)
```
/admin/sso-config
  - Add new SSO provider
  - Upload SAML metadata XML
  - Configure attribute mapping
  - Test SSO connection
  - Enable/disable for organization
```

#### Environment Variables
```bash
# WorkOS
WORKOS_API_KEY=sk_live_xxxxx
WORKOS_CLIENT_ID=client_xxxxx

# Azure AD
AZURE_AD_TENANT_ID=tenant-id
AZURE_AD_CLIENT_ID=client-id
AZURE_AD_CLIENT_SECRET=secret

# Clever
CLEVER_CLIENT_ID=client-id
CLEVER_CLIENT_SECRET=secret
```

## Rationale

### Why WorkOS (Not DIY SAML)?

**SAML is complex**:
- 50+ pages of XML specification
- Certificate management (rotation, expiration)
- Multiple bindings (POST, Redirect, Artifact)
- Difficult to debug (cryptic XML errors)

**WorkOS abstracts complexity**:
- Handles SAML parsing and validation
- Manages certificates automatically
- Provides unified API for multiple providers
- Enterprise-grade security (SOC 2, ISO 27001)
- 99.99% uptime SLA

**Cost-benefit analysis**:
- DIY SAML: 4-6 weeks engineering ($20k-30k)
- WorkOS: $299/month ($3,588/year)
- Break-even: 2 months
- Ongoing maintenance: $0 (vs $500-1000/month DIY)

### Why Not Supabase Auth Only?

**Supabase Auth limitations**:
- ✅ Good: OAuth support (Google, Azure, GitHub)
- ❌ Missing: SAML support (required by many schools)
- ❌ Missing: JIT provisioning (automatic user creation)
- ❌ Missing: Directory sync (import rosters)
- ❌ Missing: Advanced role mapping

**Supabase + WorkOS is best of both worlds**:
- Supabase handles JWT, sessions, RLS
- WorkOS handles SSO complexity
- Simple integration (WorkOS → Supabase)

### Why Support Email/Password?

**Small schools and individual parents**:
- 60% of users don't have SSO
- Parents at home (not school accounts)
- Homeschool families
- Charter schools without IT infrastructure

**Migration complexity**:
- Can't force 1000+ users to switch
- Need gradual rollout
- Support both for 12+ months

### Why This Matters for Business

**Revenue impact**:
- 5 blocked deals ($50k-200k ARR each) = $250k-1M ARR
- Enterprise pricing tier: $5k-20k/school/year (vs $500/year individual)
- Total addressable market increases 10x

**Competitive positioning**:
- Canvas, Schoology, Schoology have SSO
- Required for RFP responses
- Table stakes for K-12 enterprise

## Consequences

### Positive
- **Revenue growth**: Unlock $250k-1M ARR in enterprise deals
- **Security improvement**: Centralized auth, MFA enforcement, no password sharing
- **User experience**: One-click login, no password management
- **IT team happiness**: District IT controls access, automatic deprovisioning
- **Compliance**: FERPA, COPPA compliant identity management
- **Scalability**: Support 10k+ users per district

### Negative
- **Additional cost**: $299/month for WorkOS ($3,588/year)
- **Complexity**: More authentication flows to maintain
- **Testing burden**: Must test each SSO provider configuration
- **Support complexity**: Troubleshoot SSO issues with school IT departments
- **Longer onboarding**: Enterprise customers need SSO setup before launch
- **Dependency**: Reliant on WorkOS uptime and API stability

### Neutral
- **Not a silver bullet**: SSO doesn't solve all auth problems (still need RBAC)
- **Gradual rollout**: Can't force existing users to switch immediately
- **Learning curve**: Team needs to understand OAuth, SAML, OIDC

## Alternatives Considered

### Alternative 1: Auth0 (Full Auth Platform)
**Description**: Replace Supabase Auth entirely with Auth0

**Pros**:
- Best-in-class SSO support (every provider)
- Built-in MFA, passwordless, social login
- Excellent documentation and support
- 7,000+ integrations

**Cons**:
- $240/month minimum (vs $299 WorkOS but replaces Supabase)
- Must migrate 1000+ users (3-4 weeks effort)
- Lose Supabase RLS integration (custom middleware needed)
- More expensive at scale ($0.05/MAU after 500 users)

**Cost at 10k MAU**: $240 + (10k × $0.05) = $740/month

**Why not chosen**: **Too disruptive**. Supabase Auth + RLS is working well. Auth0 requires rewriting authentication layer. Not worth 3-4 weeks engineering for marginal improvement.

### Alternative 2: SuperTokens (Open Source)
**Description**: Self-hosted open-source auth platform

**Pros**:
- Open source (MIT license)
- Self-hosted (control and privacy)
- SSO, MFA, session management built-in
- Free (infrastructure cost only)

**Cons**:
- Must self-host (DevOps burden)
- Requires 2-3 weeks setup and integration
- Operational overhead (monitoring, backups, security patches)
- No enterprise support (community only)
- Less mature than Auth0/WorkOS

**Estimated cost**: $200/month (infrastructure) + $2k/month (DevOps time)

**Why not chosen**: **Operational complexity**. We're a small team (5-10 engineers). Self-hosting auth is a distraction from core product. $299/month WorkOS is cheaper than DevOps time.

### Alternative 3: DIY SAML Implementation
**Description**: Build SAML support directly in Supabase Edge Functions

**Pros**:
- No additional vendor cost
- Full control over implementation
- Learning opportunity for team

**Cons**:
- 4-6 weeks engineering time ($20k-30k)
- Ongoing maintenance (certificate rotation, spec updates)
- Security risk (SAML is complex, easy to get wrong)
- Must test against every IdP (Azure, Okta, OneLogin, etc.)
- No support when things break

**Why not chosen**: **Not core competency**. We're an educational platform, not an identity provider. $299/month WorkOS is a bargain vs building and maintaining SAML.

### Alternative 4: No SSO (Enterprise Only via Partners)
**Description**: Partner with ClassLink or Clever, only support their SSO

**Pros**:
- Simpler integration (one provider)
- Education-specific features (rostering, gradebooks)
- Lower development cost

**Cons**:
- Excludes non-Clever/ClassLink schools (50%+ of market)
- Partner takes 20-30% revenue cut
- Lose direct customer relationship
- Can't support Azure AD-only customers

**Why not chosen**: **Limits market**. Many schools use Azure AD or Okta directly, not through Clever/ClassLink. Want to support both direct and partner channels.

## Implementation Notes

### Phase 1: Azure AD OAuth (Month 1 - Feb 2026)

**Week 1: Setup**
1. Enable Azure AD provider in Supabase dashboard
2. Register app in Azure AD portal
3. Configure redirect URIs
4. Set up test Azure AD tenant

**Week 2: Frontend Integration**
```typescript
// src/components/auth/SSOButton.tsx
export function AzureADButton() {
  const signInWithAzure = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile openid',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error(error);
  };

  return (
    <Button onClick={signInWithAzure}>
      <MicrosoftIcon /> Sign in with Microsoft
    </Button>
  );
}
```

**Week 3: Backend - User Provisioning**
```typescript
// supabase/functions/auth-callback/index.ts
export async function handleSSOCallback(user: SSOUser) {
  // Check if user exists
  const existing = await supabase
    .from('profiles')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!existing) {
    // JIT provisioning
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.name,
      role: mapRoleFromSSO(user.groups),
      tenant_id: extractTenantFromDomain(user.email)
    });
  }

  return { success: true };
}
```

**Week 4: Testing & Pilot**
- Test with internal team (Microsoft accounts)
- Pilot with 1-2 schools
- Monitor error rates
- Collect feedback

### Phase 2: WorkOS SAML Integration (Months 2-3 - Mar-Apr 2026)

**Week 1-2: WorkOS Setup**
1. Sign up for WorkOS account
2. Configure Supabase as downstream IdP
3. Set up webhook endpoints
4. Test with WorkOS sandbox environment

**Week 3-4: SSO Admin Portal**
```typescript
// src/pages/admin/SSOConfig.tsx
export function SSOConfigPage() {
  return (
    <AdminLayout>
      <h1>SSO Configuration</h1>
      <SSOProviderList />
      <AddProviderForm />
      <SAMLMetadataUpload />
      <TestConnectionButton />
    </AdminLayout>
  );
}
```

**Week 5-6: SAML Providers**
1. Azure AD SAML (in addition to OAuth)
2. Okta
3. Generic SAML (for any provider)

**Week 7-8: Clever Integration**
```typescript
// Clever-specific API
import { Clever } from '@clever/api';

export async function syncCleverRoster(districtId: string) {
  const students = await clever.districts(districtId).students();
  const teachers = await clever.districts(districtId).teachers();
  
  // Bulk import to database
  await importStudents(students);
  await importTeachers(teachers);
}
```

### Phase 3: Advanced Features (Months 4-6 - May-Jul 2026)

**Just-in-Time Provisioning**
- Automatic account creation on first SSO login
- Map SAML attributes to user profile
- Assign to tenant based on domain or SAML attribute

**SCIM (System for Cross-domain Identity Management)**
```typescript
// SCIM endpoints for user lifecycle
POST /scim/v2/Users      // Create user
PUT /scim/v2/Users/:id   // Update user
DELETE /scim/v2/Users/:id // Deactivate user
GET /scim/v2/Users       // List users
```

**Directory Sync**
- Nightly sync of Azure AD directory
- Import roster (students, teachers, classes)
- Update user attributes
- Handle deprovisioning (graduated students, departed teachers)

**MFA Enforcement**
```typescript
// Require MFA for admin accounts
if (user.role === 'admin' && !user.mfa_enabled) {
  return redirect('/settings/security/enable-mfa');
}
```

### Migration Path for Existing Users

**Scenario 1: Existing email/password user switches to SSO**
```
1. User logs in with email/password (old way)
2. Banner: "Your school now supports SSO. Link your Microsoft account?"
3. User clicks "Link Account"
4. Redirect to Azure AD → authenticate
5. Backend links Azure AD identity to existing profile
6. Future logins: Can use either email/password OR SSO
```

**Scenario 2: Enterprise customer onboarding**
```
1. Sales team closes deal with school district
2. Customer Success creates tenant in admin portal
3. IT admin uploads SAML metadata
4. CS tests SSO connection
5. IT admin invites teachers/staff via email
6. Teachers click invite link → SSO login → auto-provision
```

### Rollback Strategy

**If SSO causes authentication issues**:
1. **Disable SSO provider**: Turn off Azure/Okta/Clever in config
2. **Fallback to email/password**: All users can still log in old way
3. **Investigate root cause**: Check WorkOS logs, SAML assertions
4. **Fix and re-enable**: Test thoroughly before turning back on

**Emergency rollback procedure** (< 5 minutes):
```bash
# Disable SSO in environment variables
ENABLE_SSO=false

# Deploy hotfix
git revert HEAD
git push origin main

# Notify affected customers
# Revert takes ~2 minutes to propagate
```

### Success Criteria

**Technical**:
- [ ] Azure AD OAuth integration live
- [ ] WorkOS SAML integration live
- [ ] Support Okta, Azure SAML, Clever
- [ ] JIT provisioning working
- [ ] Admin portal for SSO configuration
- [ ] 99.9% SSO login success rate
- [ ] < 3 second SSO redirect time

**Business**:
- [ ] 3+ enterprise customers using SSO
- [ ] $250k+ ARR from SSO-enabled deals
- [ ] Zero security incidents related to SSO
- [ ] < 5 support tickets/month about SSO

**User Experience**:
- [ ] One-click login for SSO users
- [ ] Clear error messages when SSO fails
- [ ] Seamless fallback to email/password
- [ ] Teachers report "easier than email/password"

## Security & Compliance

### OAuth/SAML Security Checklist
- [ ] Validate token signatures (prevent forgery)
- [ ] Check token expiration (prevent replay attacks)
- [ ] Verify issuer (prevent token substitution)
- [ ] Use state parameter (CSRF protection)
- [ ] HTTPS only (prevent man-in-the-middle)
- [ ] Rotate secrets quarterly
- [ ] Log all SSO events (audit trail)

### COPPA/FERPA Compliance
- [ ] Minimal data collection from SSO (email, name, role only)
- [ ] Student data stays within district's IdP (not stored in Odyssey)
- [ ] Parent consent flows for < 13 years old
- [ ] Data processing agreement (DPA) with WorkOS
- [ ] Right to be forgotten (delete SSO-linked accounts)

### Audit Logging
```typescript
// Log all SSO events
await supabase.from('security_access_log').insert({
  user_id: user.id,
  action: 'sso_login',
  provider: 'azure_ad',
  ip_address: request.ip,
  user_agent: request.headers.get('user-agent'),
  success: true,
  metadata: { tenant_id: user.tenant_id }
});
```

## Cost Analysis

### Year 1 Costs
- WorkOS: $299/month × 12 = $3,588
- Engineering time: 6 weeks × $50/hour × 40 hours = $12,000
- Testing/QA: 2 weeks × $40/hour × 40 hours = $3,200
- **Total Year 1**: $18,788

### Year 2+ Costs
- WorkOS: $299/month × 12 = $3,588
- Maintenance: 1 week/quarter × $50/hour × 40 hours = $8,000
- **Total Year 2**: $11,588

### Revenue Impact
- 5 enterprise deals × $100k ARR average = $500k ARR
- Gross margin: 80% = $400k gross profit
- **ROI**: $400k / $18.8k = 21x return on investment (Year 1)

### Break-Even Analysis
- Implementation cost: $18,788
- First enterprise deal: $50k ARR
- Break-even: 0.4 deals (essentially immediate)

## Monitoring & Observability

### SSO Health Dashboard
```
Metrics to track:
- SSO login success rate (target: > 99%)
- SSO login latency (target: < 3s)
- Provider-specific success rates
- Errors by type (invalid token, expired cert, etc.)
- Daily/weekly SSO logins by provider
```

### Alerts
- SSO success rate drops below 95%
- Certificate expiration within 30 days
- WorkOS API errors spike
- Unusual SSO login patterns (potential breach)

## References

- [WorkOS Documentation](https://workos.com/docs)
- [Supabase Auth with OAuth](https://supabase.com/docs/guides/auth/social-login)
- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Clever API Docs](https://dev.clever.com/)

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-09 | Platform Architecture Team | Initial draft and acceptance |
