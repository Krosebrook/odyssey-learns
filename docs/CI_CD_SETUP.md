# CI/CD Setup Guide

## Overview

Inner Odyssey uses GitHub Actions for continuous integration and deployment. This guide covers everything you need to know about our automated testing, building, and deployment workflows.

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** On every pull request and push to `main` or `develop` branches

**What it does:**
- Lints code with ESLint
- Type-checks with TypeScript
- Builds production bundle
- Runs unit tests with Jest
- Runs integration tests
- Security scanning (npm audit, secret detection)
- Performance checks (bundle size, Lighthouse CI)
- Uploads test coverage to Codecov

**Performance Budgets:**
- Bundle size: < 5MB
- Lighthouse Performance: > 90
- Lighthouse Accessibility: > 90

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)

**Triggers:** Automatically on push to `develop` branch

**What it does:**
- Runs full CI checks
- Deploys Supabase Edge Functions
- Deploys frontend to staging environment
- Notifies team of deployment status

**Staging URL:** https://staging.innerodyssey.lovable.app

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)

**Triggers:** Automatically on push to `main` branch (requires manual approval)

**What it does:**
- Creates database backup
- Runs full CI checks
- Deploys Edge Functions (backward compatible first)
- Deploys frontend
- Runs smoke tests
- Monitors error rates for 5 minutes
- Notifies team

**Production URL:** https://innerodyssey.lovable.app

## GitHub Secrets Configuration

You need to configure these secrets in GitHub Settings → Secrets and variables → Actions:

### Required Secrets:
```
SUPABASE_PROJECT_ID=hcsglifjqdmiykrrmncn
SUPABASE_ACCESS_TOKEN=<your-token>  # Get from Supabase dashboard
```

### Optional Secrets:
```
LIGHTHOUSE_CI_TOKEN=<token>          # For performance tracking history
SLACK_WEBHOOK_URL=<url>              # For team notifications
CODECOV_TOKEN=<token>                # For coverage tracking
```

## How to Get Supabase Access Token

1. Go to https://supabase.com/dashboard
2. Click on your profile (top right)
3. Go to "Access Tokens"
4. Click "Generate New Token"
5. Name it "GitHub CI/CD"
6. Copy the token and add to GitHub Secrets

## Running Tests Locally

### Unit Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run Playwright tests
npm run test:e2e:ui       # Interactive mode
npm run test:e2e:debug    # Debug mode
```

### Linting
```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

### Type Checking
```bash
npx tsc --noEmit         # Check types without building
```

## Adding New Tests

### Unit Tests
Place tests in `src/**/__tests__/` or `src/**/*.test.tsx`

Example:
```typescript
// src/components/__tests__/NPSSurvey.test.tsx
import { render, screen } from '@testing-library/react';
import { NPSSurvey } from '../NPSSurvey';

test('renders NPS survey', () => {
  render(<NPSSurvey campaignId="123" onComplete={() => {}} />);
  expect(screen.getByText(/recommend/i)).toBeInTheDocument();
});
```

### E2E Tests
Place tests in `e2e/*.spec.ts`

Example:
```typescript
// e2e/parent-flow.spec.ts
import { test, expect } from '@playwright/test';

test('parent can add child', async ({ page }) => {
  await page.goto('/parent-setup');
  // ... test steps
});
```

## Troubleshooting CI Failures

### Build Fails
- Check TypeScript errors: `npx tsc --noEmit`
- Check for missing dependencies
- Clear cache: `npm ci` (instead of `npm install`)

### Tests Fail
- Run locally: `npm test`
- Check for timing issues in async tests
- Verify mock data matches schema

### Deployment Fails
- Check Supabase credentials are correct
- Verify edge function syntax
- Check for migration conflicts

### Bundle Size Exceeds Budget
- Run bundle analyzer: `npm run build -- --analyze`
- Check for large dependencies
- Implement code splitting
- Use dynamic imports for heavy components

### Lighthouse Score Too Low
- Check for large images (use WebP)
- Implement lazy loading
- Minimize JavaScript bundle
- Check for render-blocking resources

## Manual Deployment Commands

### Deploy Edge Functions Only
```bash
npx supabase functions deploy --project-ref hcsglifjqdmiykrrmncn
```

### Deploy Specific Function
```bash
npx supabase functions deploy survey-analytics --project-ref hcsglifjqdmiykrrmncn
```

### Run Database Migration
```bash
npx supabase db push --project-ref hcsglifjqdmiykrrmncn
```

## Rollback Procedures

### Quick Rollback (Frontend)
1. Go to GitHub Actions
2. Find last successful deployment
3. Click "Re-run jobs"

### Database Rollback
```sql
-- Manually revert migration in Supabase dashboard SQL editor
-- Or restore from backup (see backup section)
```

### Edge Function Rollback
1. Go to Supabase dashboard
2. Functions tab
3. Select function
4. Click "Deploy previous version"

## Monitoring & Alerts

### Where to Check
- **CI Status:** GitHub Actions tab
- **Deployment Status:** Lovable Cloud dashboard
- **Error Tracking:** Supabase logs
- **Performance:** Performance Dashboard (built-in)

### Alert Triggers
- Build failures → GitHub notifications
- Test failures → GitHub notifications
- Performance degradation → Performance Dashboard
- High error rates → Manual check needed

## Best Practices

1. **Always run tests locally before pushing**
   ```bash
   npm run lint && npm test && npm run build
   ```

2. **Write tests for new features**
   - Unit tests for components
   - Integration tests for user flows
   - E2E tests for critical paths

3. **Keep bundle size small**
   - Use dynamic imports
   - Optimize images
   - Remove unused dependencies

4. **Monitor CI times**
   - Target: < 5 minutes for full CI
   - If slower, investigate bottlenecks

5. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to .gitignore
   - Use GitHub Secrets for CI/CD

## Common Commands Cheat Sheet

```bash
# Local Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build

# Testing
npm test                       # Unit tests
npm run test:e2e               # E2E tests
npm run lint                   # Lint code

# CI/CD
git push origin develop        # Deploy to staging
git push origin main           # Deploy to production (requires approval)

# Supabase
npx supabase functions deploy  # Deploy all functions
npx supabase db push           # Push migrations
npx supabase db pull           # Pull schema changes
```

## Getting Help

- **CI Issues:** Check GitHub Actions logs
- **Deployment Issues:** Check Lovable Cloud logs
- **Test Failures:** Run locally with `--verbose` flag
- **Performance Issues:** Use Chrome DevTools Lighthouse

## Maintenance Schedule

- **Weekly:** Review CI times and optimize
- **Monthly:** Update dependencies
- **Quarterly:** Security audit
- **Annually:** Major version upgrades
