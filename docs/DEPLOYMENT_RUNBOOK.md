# Deployment Runbook

## Pre-Deployment Checklist

### 24 Hours Before
- [ ] Review all merged PRs since last deployment
- [ ] Check for breaking changes in dependencies
- [ ] Verify all migrations are tested
- [ ] Run full test suite locally
- [ ] Review performance metrics from staging
- [ ] Check for open security vulnerabilities

### 1 Hour Before
- [ ] Announce deployment window in team chat
- [ ] Verify backup systems are functioning
- [ ] Check current error rates (should be < 0.1%)
- [ ] Ensure on-call engineers are available
- [ ] Review rollback procedures

### Immediately Before
- [ ] Run final smoke tests on staging
- [ ] Verify database migrations are idempotent
- [ ] Check Supabase project health
- [ ] Create pre-deployment backup
- [ ] Put monitoring alerts on high sensitivity

## Deployment Steps

### Step 1: Database Migrations (if needed)
```bash
# 1. Review migration SQL
cat supabase/migrations/<latest-migration>.sql

# 2. Test on staging first
npx supabase db push --project-ref <staging-project-id>

# 3. If successful, apply to production
npx supabase db push --project-ref hcsglifjqdmiykrrmncn

# 4. Verify migration success
# Check Supabase dashboard → Database → Schema
```

**Rollback if needed:**
```sql
-- Manually revert in Supabase SQL editor
-- Use backup from Step 0
```

### Step 2: Deploy Edge Functions
```bash
# 1. Deploy all functions
npx supabase functions deploy --project-ref hcsglifjqdmiykrrmncn

# 2. Verify deployment
npx supabase functions list --project-ref hcsglifjqdmiykrrmncn

# 3. Test critical functions
curl -X POST https://hcsglifjqdmiykrrmncn.supabase.co/functions/v1/health-check
```

**Expected Response:**
```json
{"status": "healthy", "timestamp": "2025-11-15T..."}
```

### Step 3: Deploy Frontend
```bash
# Automatic via GitHub Actions
git push origin main

# Or manual via Lovable Cloud dashboard
# 1. Go to Lovable Cloud
# 2. Click "Deploy"
# 3. Select production environment
# 4. Confirm deployment
```

### Step 4: Post-Deployment Verification

**Automated Checks (CI/CD handles):**
- Health endpoint returns 200 OK
- Critical pages load successfully
- No console errors
- Lighthouse scores within budgets

**Manual Checks:**
1. **Authentication Flow**
   - Sign up new user
   - Log in existing user
   - Password reset works

2. **Core Features**
   - Parent can add child
   - Child can complete lesson
   - Points are awarded correctly
   - Survey modal appears

3. **Performance**
   - Dashboard loads < 2s
   - No JavaScript errors in console
   - Images load correctly

4. **Data Integrity**
   - User progress saves correctly
   - Analytics track properly
   - Notifications send successfully

### Step 5: Monitor for 1 Hour

**Watch These Metrics:**
- Error rate (target: < 0.1%)
- Response times (target: p95 < 500ms)
- User sign-ups (should not drop)
- Lesson completion rate (should not drop)

**Tools:**
- Supabase Logs
- Performance Dashboard
- Browser console (open app in incognito)

## Rollback Procedures

### Scenario 1: Frontend Issues (No Database Changes)
```bash
# Option A: Re-deploy previous version via GitHub
# 1. Find last successful deployment in GitHub Actions
# 2. Click "Re-run jobs"

# Option B: Revert commit
git revert HEAD
git push origin main
```

### Scenario 2: Edge Function Issues
```bash
# 1. Go to Supabase dashboard
# 2. Functions tab
# 3. Select broken function
# 4. Click "Deploy previous version"

# Or CLI:
npx supabase functions deploy <function-name> --project-ref hcsglifjqdmiykrrmncn --no-verify-jwt
```

### Scenario 3: Database Migration Issues
```bash
# 1. Create backup of current state
# Download from Supabase dashboard → Database → Backups

# 2. Manually revert migration
# Open Supabase SQL editor
# Run reverse migration SQL (prepared in advance)

# 3. Verify data integrity
# Run test queries to check critical tables
```

### Scenario 4: Critical Production Bug
```bash
# IMMEDIATE ACTIONS:
# 1. Revert to last known good version (use Option A above)
# 2. Notify all users via status page
# 3. Fix bug on develop branch
# 4. Test thoroughly on staging
# 5. Re-deploy when ready

# EMERGENCY HOTFIX PROCESS:
git checkout main
git checkout -b hotfix/critical-bug
# ... fix bug ...
git commit -m "hotfix: critical bug description"
git push origin hotfix/critical-bug
# Create PR directly to main (bypass normal process)
# Requires 2 approvals
```

## Emergency Contacts

**On-Call Engineers:**
- Primary: [Name] - [Phone]
- Secondary: [Name] - [Phone]

**Supabase Support:**
- Email: support@supabase.com
- Slack: #support channel

**Lovable Cloud Support:**
- Email: support@lovable.dev
- Discord: Link in Lovable dashboard

## Post-Deployment Tasks

### Immediately After (0-1 hour)
- [ ] Monitor error rates for spikes
- [ ] Check user feedback channels
- [ ] Verify analytics tracking
- [ ] Update deployment log

### Next Day
- [ ] Review deployment metrics
- [ ] Check for user-reported issues
- [ ] Update documentation if needed
- [ ] Share deployment summary with team

### Next Week
- [ ] Review performance trends
- [ ] Check for slow queries in database
- [ ] Optimize if needed
- [ ] Plan next deployment

## Deployment Log Template

```markdown
## Deployment: YYYY-MM-DD HH:MM

**Deployed By:** [Name]
**Version:** vX.Y.Z
**Environment:** Production

### Changes
- Feature: [Description]
- Fix: [Description]
- Migration: [Description]

### Pre-Deployment Status
- Error Rate: X%
- Response Time (p95): Xms
- Active Users: X

### Post-Deployment Status
- Error Rate: X%
- Response Time (p95): Xms
- Active Users: X

### Issues Encountered
- [None / Issue description]

### Rollback Required?
- [Yes / No]

### Notes
- [Any additional context]
```

## Common Issues & Solutions

### Issue: Deployment Hangs
**Symptoms:** GitHub Action stuck on "Deploying..."
**Solution:**
1. Check Lovable Cloud status page
2. Verify network connectivity
3. Cancel and retry deployment
4. If persists, contact support

### Issue: Database Connection Errors
**Symptoms:** "Connection pool exhausted"
**Solution:**
1. Check Supabase dashboard for connection count
2. Optimize queries to use fewer connections
3. Increase connection pool size (if needed)
4. Restart Supabase project (last resort)

### Issue: Edge Function Timeouts
**Symptoms:** 504 Gateway Timeout
**Solution:**
1. Check function logs in Supabase
2. Optimize function code (reduce API calls)
3. Increase function timeout (max 2 minutes)
4. Consider breaking into smaller functions

### Issue: Performance Degradation
**Symptoms:** Slow page loads, high response times
**Solution:**
1. Check Performance Dashboard for bottlenecks
2. Review recent code changes
3. Check database query performance
4. Enable caching if not already
5. Consider CDN for static assets

## Success Criteria

A deployment is considered successful when:
- ✅ All automated tests pass
- ✅ Health checks return 200 OK
- ✅ Error rate < 0.1% (1 hour post-deploy)
- ✅ No user-reported critical bugs (24 hours post-deploy)
- ✅ Performance metrics within budgets
- ✅ No data loss or corruption
- ✅ All features work as expected

## Notes

- Always deploy to staging first
- Never deploy on Fridays (unless emergency)
- Keep deployment window < 30 minutes
- Document everything
- When in doubt, rollback and investigate
