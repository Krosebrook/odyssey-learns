# Secrets Management Guide
## Odyssey Learns Platform

**Version**: 1.0  
**Last Updated**: 2026-02-09  
**Owner**: Platform Architecture Team  
**Classification**: Internal - Team Access Only

---

## Table of Contents

1. [Overview](#overview)
2. [Secret Inventory](#secret-inventory)
3. [Storage & Access](#storage--access)
4. [Rotation Schedule](#rotation-schedule)
5. [Emergency Procedures](#emergency-procedures)
6. [Best Practices](#best-practices)

---

## Overview

This document catalogs all secrets used in the Odyssey Learns platform and provides procedures for secure management, rotation, and emergency response.

**Principles**:
- ✅ Never commit secrets to git
- ✅ Rotate secrets quarterly
- ✅ Use environment-specific secrets (dev, staging, prod)
- ✅ Minimum privilege access
- ✅ Audit secret access

---

## Secret Inventory

### Production Secrets

| Secret Name | Purpose | Storage | Rotation | Owner |
|-------------|---------|---------|----------|-------|
| `SUPABASE_URL` | Supabase project URL | GitHub Secrets | Stable (project URL) | DevOps |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | GitHub Secrets + Client | Annual | DevOps |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access | GitHub Secrets | Quarterly | DevOps |
| `SUPABASE_PROJECT_ID` | Supabase project ID | GitHub Secrets | Stable | DevOps |
| `VITE_SUPABASE_URL` | Client-side Supabase URL | Vercel Env Vars | Stable | DevOps |
| `VITE_SUPABASE_ANON_KEY` | Client-side anon key | Vercel Env Vars | Annual | DevOps |
| `SLACK_WEBHOOK_URL` | Deployment notifications | GitHub Secrets | Annual | DevOps |
| `CODECOV_TOKEN` | Code coverage uploads | GitHub Secrets | Annual | DevOps |
| `WORKOS_API_KEY` | SSO/SAML provider | GitHub Secrets | Quarterly | Backend Lead |
| `WORKOS_CLIENT_ID` | WorkOS client ID | GitHub Secrets | Annual | Backend Lead |

### Staging Secrets

| Secret Name | Purpose | Storage | Rotation | Owner |
|-------------|---------|---------|----------|-------|
| `SUPABASE_URL_STAGING` | Staging Supabase URL | GitHub Secrets | Stable | DevOps |
| `SUPABASE_ANON_KEY_STAGING` | Staging anon key | GitHub Secrets | Annual | DevOps |

### Development Secrets

| Secret Name | Purpose | Storage | Rotation | Owner |
|-------------|---------|---------|----------|-------|
| `.env.local` | Local development | Git-ignored file | As needed | Individual devs |

---

## Storage & Access

### GitHub Secrets

**Access Control**:
- Organization owners: Full access
- Repository maintainers: Read/write
- Contributors: No access (secrets injected at runtime)

**Location**: GitHub Settings → Secrets and variables → Actions

**How to Add**:
```bash
# Via GitHub UI
Repository → Settings → Secrets and variables → Actions → New repository secret

# Or via GitHub CLI
gh secret set SECRET_NAME --body "secret_value"
```

**How to Use in Workflows**:
```yaml
jobs:
  deploy:
    steps:
      - name: Deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          npx supabase deploy --token $SUPABASE_ACCESS_TOKEN
```

---

### Vercel Environment Variables

**Access Control**:
- Team owners: Full access
- Team members: Read-only

**Location**: Vercel Dashboard → Project → Settings → Environment Variables

**Environments**:
- Production (main branch)
- Preview (all other branches)
- Development (local)

**How to Add**:
```bash
# Via Vercel UI
Project → Settings → Environment Variables → Add

# Or via Vercel CLI
vercel env add SECRET_NAME production
```

---

### Local Development

**File**: `.env.local` (git-ignored)

**Setup**:
```bash
# Copy template
cp .env.example .env.local

# Fill in values (get from team lead)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**⚠️ Never commit `.env.local`** - it's in `.gitignore`

---

## Rotation Schedule

### Quarterly Rotation (Every 3 Months)

**Secrets**:
- `SUPABASE_ACCESS_TOKEN`
- `WORKOS_API_KEY`

**Process**:
1. Generate new token in respective platform (Supabase, WorkOS)
2. Test new token in staging environment
3. Update GitHub Secret
4. Trigger staging deployment to verify
5. Update production secret
6. Trigger production deployment
7. Revoke old token after 24 hours (grace period)

**Next Rotation**: 2026-05-09 (quarterly)

---

### Annual Rotation (Every 12 Months)

**Secrets**:
- `SUPABASE_ANON_KEY` (regenerate in Supabase dashboard)
- `SLACK_WEBHOOK_URL` (regenerate in Slack app settings)
- `CODECOV_TOKEN` (regenerate in Codecov settings)
- `WORKOS_CLIENT_ID` (usually stable, check if API changes)

**Process**:
1. Schedule maintenance window (off-peak hours)
2. Generate new secrets in respective platforms
3. Update all environments (staging, then production)
4. Deploy and test thoroughly
5. Monitor for 24 hours
6. Revoke old secrets

**Next Rotation**: 2027-02-09 (annual)

---

### Stable Secrets (No Rotation Needed)

**Secrets**:
- `SUPABASE_URL` (project URL, only changes if migrating projects)
- `SUPABASE_PROJECT_ID` (project ID, stable)
- `VITE_SUPABASE_URL` (same as above)

**Review**: Annually to confirm still accurate

---

## Emergency Procedures

### Scenario 1: Secret Leaked to Git

**Immediate Actions** (within 1 hour):
1. **Revoke the compromised secret** immediately (don't wait)
2. **Generate new secret** in platform
3. **Update GitHub Secret** and Vercel env vars
4. **Deploy emergency hotfix** with new secret
5. **Notify team** in #incidents Slack channel

**Post-Incident** (within 24 hours):
1. **Investigate**: How was it leaked? (git history, logs, screenshot)
2. **Audit**: Check access logs for unauthorized use
3. **Git History**: Use BFG Repo-Cleaner to remove from history
   ```bash
   # Remove secret from git history
   bfg --replace-text passwords.txt odyssey-learns.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```
4. **Report**: Document in incident report
5. **Prevent**: Update `.gitignore`, add pre-commit hook, train team

**Notification Template**:
```
🚨 SECURITY INCIDENT: Secret Leaked

Secret: [NAME] (production)
Revoked: ✅ [TIME]
New secret deployed: ✅ [TIME]
Impact: [Describe any unauthorized access]
Action: All team members review security best practices

Incident report: [Link]
```

---

### Scenario 2: Unauthorized Access Detected

**Symptoms**: Unusual API calls, unexpected deploys, strange errors

**Immediate Actions** (within 30 minutes):
1. **Rotate ALL production secrets** immediately
2. **Review access logs** (GitHub, Supabase, WorkOS)
3. **Disable compromised accounts** if identified
4. **Deploy with new secrets**
5. **Notify security team** and CTO

**Investigation**:
1. Check GitHub audit log for unusual activity
2. Check Supabase logs for suspicious queries
3. Check WorkOS logs for auth attempts
4. Review team access (who has access to secrets?)

**Prevention**:
1. Enable 2FA for all team members (GitHub, Supabase, Vercel)
2. Review and minimize secret access
3. Implement secret scanning (TruffleHog in CI)
4. Monthly access review

---

### Scenario 3: Platform Compromise (Supabase, WorkOS, etc.)

**Symptoms**: Vendor reports breach, security advisory

**Immediate Actions**:
1. **Assess scope**: What data was exposed?
2. **Rotate secrets** on that platform immediately
3. **Monitor logs** for suspicious activity
4. **Notify customers** if user data affected (GDPR/COPPA)
5. **Follow vendor guidance** for remediation

**Communication**:
- Customers: Within 72 hours (GDPR requirement)
- Team: Immediately
- Board/Investors: Within 24 hours if material impact

---

## Best Practices

### For Developers

**DO**:
- ✅ Use `.env.local` for local secrets (git-ignored)
- ✅ Request secrets from team lead (never ask in public Slack)
- ✅ Use `process.env.VARIABLE` in code
- ✅ Validate environment variables at app startup
- ✅ Use different secrets for staging and production

**DON'T**:
- ❌ Commit secrets to git (even in `.env.example`)
- ❌ Share secrets in Slack, email, or text
- ❌ Hard-code secrets in source code
- ❌ Log secrets (even for debugging)
- ❌ Use production secrets in development

---

### Code Examples

**❌ Bad: Hard-coded secret**:
```typescript
const apiKey = 'sk_live_abc123'; // NEVER DO THIS
```

**❌ Bad: Logged secret**:
```typescript
console.log('API Key:', process.env.API_KEY); // NEVER LOG SECRETS
```

**✅ Good: Environment variable**:
```typescript
const apiKey = process.env.WORKOS_API_KEY;
if (!apiKey) {
  throw new Error('WORKOS_API_KEY is required');
}
```

**✅ Good: Validate at startup**:
```typescript
// src/lib/env.ts
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

### Secret Scanning

**Pre-commit Hook** (Husky + TruffleHog):
```bash
# .husky/pre-commit
#!/bin/sh
trufflehog filesystem . --fail --no-update
```

**CI Pipeline** (GitHub Actions):
```yaml
# .github/workflows/ci.yml
secret-scan:
  name: Secret Scanning
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Run TruffleHog
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: ${{ github.event.repository.default_branch }}
        head: HEAD
```

---

## Audit & Compliance

### Monthly Secret Audit

**Checklist**:
- [ ] Review who has access to secrets (GitHub, Vercel)
- [ ] Check for unused secrets (remove)
- [ ] Verify rotation schedule is followed
- [ ] Test secret rotation procedure in staging
- [ ] Review access logs for anomalies

**Owner**: DevOps Lead  
**Frequency**: First Monday of each month  
**Duration**: 30 minutes

---

### Quarterly Security Review

**Checklist**:
- [ ] Rotate quarterly secrets (Supabase access token, WorkOS API key)
- [ ] Review and update this documentation
- [ ] Audit team member access (remove departed employees)
- [ ] Test emergency procedures (tabletop exercise)
- [ ] Review secret scanning alerts (false positives?)

**Owner**: Security Team + Platform Architect  
**Frequency**: First week of quarter (Feb, May, Aug, Nov)  
**Duration**: 2 hours

---

## Contact Information

### Secret-Related Questions

| Topic | Contact | Channel |
|-------|---------|---------|
| General secrets | DevOps Lead | #engineering-ops |
| Security incident | Security Team | #incidents |
| Urgent production issue | On-call engineer | PagerDuty |
| Access request | Engineering Manager | Direct message |

### Escalation

1. **DevOps Lead** (first contact)
2. **Engineering Manager** (if DevOps unavailable)
3. **CTO** (critical incident only)

---

## Appendix

### Secret Naming Conventions

**Pattern**: `[PLATFORM]_[PURPOSE]_[ENV?]`

Examples:
- `SUPABASE_URL` (platform + purpose)
- `SUPABASE_URL_STAGING` (platform + purpose + env)
- `WORKOS_API_KEY` (platform + purpose)

**Guidelines**:
- Use SCREAMING_SNAKE_CASE
- Be descriptive (not just `API_KEY`)
- Include environment suffix for non-prod (`_STAGING`, `_DEV`)

---

### Checklist: Adding a New Secret

- [ ] Choose descriptive name following convention
- [ ] Document in this guide (Secret Inventory section)
- [ ] Add to GitHub Secrets (production)
- [ ] Add to Vercel env vars (if client-side)
- [ ] Add to `.env.example` (without value, just name)
- [ ] Update rotation schedule
- [ ] Assign owner for rotation
- [ ] Test in staging before production
- [ ] Document in deployment runbook if affects deploys

---

### Resources

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [ADR-004: CI/CD Pipeline Enhancement](./adr/ADR-004-cicd-pipeline-enhancement.md)

---

**Document Status**: Active  
**Next Review**: 2026-05-09 (quarterly)  
**Classification**: Internal - Team Access Only  

⚠️ **Do not share this document outside the engineering team**

---

_Last updated: 2026-02-09_
