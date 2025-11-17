# Pre-Launch Checklist - Final Countdown

## T-Minus 7 Days to Launch 🚀

This checklist should be completed in the 7 days leading up to public launch. Each item includes time estimates and dependencies.

---

## Day 1: Security & Compliance (T-7 Days)

### Security Audit (2-3 hours)
- [ ] Run `./scripts/security-audit.sh` and address all HIGH/CRITICAL findings
- [ ] Review npm audit output and update vulnerable dependencies
- [ ] Scan for hardcoded secrets and move to environment variables
- [ ] Run OWASP ZAP scan against staging environment
- [ ] Review all RLS policies in Supabase
- [ ] Verify security headers are configured (check `public/_headers`)
- [ ] Test authentication flows (signup, login, password reset)
- [ ] Verify rate limiting is working (check `rate_limit_violations` table)

### Compliance Review (1-2 hours)
- [ ] Review `docs/COMPLIANCE.md` with legal counsel (recommended)
- [ ] Update privacy policy with launch date
- [ ] Ensure terms of service are accessible
- [ ] Verify parental consent flow works correctly
- [ ] Test account deletion (right to be forgotten)
- [ ] Verify data export functionality
- [ ] Review `public/.well-known/security.txt` contact information

**Sign-off**: Security Team / CTO
**Blocker for**: Public launch

---

## Day 2: Performance & Load Testing (T-6 Days)

### Performance Validation (2-3 hours)
- [ ] Run `./scripts/performance-validation.sh`
- [ ] Verify bundle size < 1.8MB
- [ ] Run Lighthouse audit on key pages (target: >85 score)
  - Landing page
  - Parent dashboard
  - Child dashboard
  - Lesson player
- [ ] Check Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] Test on slow 3G connection
- [ ] Test on older devices (iPhone 8, Samsung S9)

### Load Testing (3-4 hours)
- [ ] Run `./scripts/load-test.sh`
- [ ] Test 10 concurrent users (target: <2s response time)
- [ ] Test 50 concurrent users (target: <3s response time)
- [ ] Test sustained load (30 min with 20 users)
- [ ] Monitor database connection pooling under load
- [ ] Check edge function cold start times
- [ ] Verify API rate limiting under heavy load

**Sign-off**: Engineering Team
**Blocker for**: Public launch

---

## Day 3: Deployment & Staging (T-5 Days)

### Staging Environment (2-3 hours)
- [ ] Deploy to staging environment (if not already done)
- [ ] Run `./scripts/staging-smoke-tests.sh`
- [ ] Seed staging database with test data (`./scripts/staging-seed-data.sql`)
- [ ] Test all critical user flows on staging:
  - Parent signup → Create child → Assign lesson → Review progress
  - Child login → Complete lesson → Unlock badge
  - Custom lesson generation → Parent approval → Share
- [ ] Test payment flow (if applicable)
- [ ] Verify email notifications are working
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

### Production Environment Setup (1-2 hours)
- [ ] Verify environment variables are set correctly
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate (auto via Lovable Cloud)
- [ ] Configure DNS records
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure error alerting (email/Slack for critical errors)
- [ ] Test production database backup restore process

**Sign-off**: DevOps / Engineering Team
**Blocker for**: Public launch

---

## Day 4: Monitoring & Alerts (T-4 Days)

### Monitoring Setup (2-3 hours)
- [ ] Verify System Health dashboard (`/system-health`) is accessible
- [ ] Test error logging flow (trigger error, verify in `error_logs` table)
- [ ] Verify performance monitoring is capturing Web Vitals
- [ ] Set up uptime monitoring alerts (target: 99.5% uptime)
- [ ] Configure error rate alerts (>10 errors/hour = warning)
- [ ] Set up database performance alerts (slow queries >1s)
- [ ] Test offline indicator component
- [ ] Verify edge function health checks are running

### Alert Thresholds (1 hour)
- [ ] **Critical (Immediate Response)**:
  - Site down for >5 minutes
  - Database connection failures
  - Authentication system failures
  - Data breach detected (security access log)
- [ ] **High (Response within 1 hour)**:
  - Error rate >50/hour
  - API response time >5s (p95)
  - Edge function failures >10%
- [ ] **Medium (Response within 4 hours)**:
  - Bundle size increase >200KB
  - Lighthouse score drop >10 points
  - Database query time >2s (p95)
- [ ] **Low (Review daily)**:
  - Minor bugs reported via feedback widget
  - Performance degradation <10%

**Sign-off**: Engineering Team
**Blocker for**: Recommended (can launch without, but risky)

---

## Day 5: Documentation & Communication (T-3 Days)

### Documentation Review (2-3 hours)
- [ ] Update `README.md` with launch information
- [ ] Review `docs/DEPLOYMENT_RUNBOOK.md` for accuracy
- [ ] Update `docs/TROUBLESHOOTING.md` with known issues
- [ ] Create user-facing changelog (features available at launch)
- [ ] Prepare onboarding tutorial walkthrough
- [ ] Create "Getting Started" guide for parents
- [ ] Create "Tips for Kids" guide for children

### Internal Communication (1-2 hours)
- [ ] Schedule launch kickoff meeting (Day before launch)
- [ ] Create launch day checklist (who does what, when)
- [ ] Define on-call rotation for first 72 hours post-launch
- [ ] Prepare incident response contact list
- [ ] Create launch day communication schedule
- [ ] Draft post-launch retrospective meeting invite (1 week after)

### External Communication (2-3 hours)
- [ ] Draft launch announcement (blog post, social media)
- [ ] Prepare email to beta testers ("We're live!")
- [ ] Update website with "Launch" status
- [ ] Prepare press kit (screenshots, description, founder bio)
- [ ] Schedule social media posts (launch day + week 1)
- [ ] Prepare launch video/demo (optional but recommended)

**Sign-off**: Product Team / Marketing
**Blocker for**: Nice-to-have (can launch without, but less impactful)

---

## Day 6: Final Testing & Bug Bash (T-2 Days)

### Bug Bash Session (3-4 hours)
- [ ] Invite entire team to "break the app"
- [ ] Test all features systematically (use `docs/TESTING.md` as guide)
- [ ] Focus on edge cases and error handling
- [ ] Test with real data (not just seed data)
- [ ] Verify all E2E tests pass (`npm run test:e2e`)
- [ ] Verify all unit tests pass (`npm test`)
- [ ] Check accessibility with screen reader
- [ ] Test keyboard navigation throughout app

### Critical Flow Verification (2 hours)
- [ ] **Parent Onboarding**: Signup → Email verification → Create child → Explore dashboard (5 min)
- [ ] **Child Learning**: Login → Daily quest → Complete lesson → Earn badge (10 min)
- [ ] **Parent Monitoring**: View progress → Read weekly report → Send message to child (5 min)
- [ ] **Custom Content**: Generate lesson → Review → Approve → Child completes (15 min)
- [ ] **Account Management**: Update settings → Change password → Delete test account (5 min)

### Known Issues Review (1 hour)
- [ ] Review open issues in issue tracker
- [ ] Categorize as "must-fix" vs. "post-launch"
- [ ] Fix all "must-fix" issues before launch
- [ ] Document known issues in `docs/KNOWN_ISSUES.md` (create if needed)
- [ ] Add workarounds for non-critical issues

**Sign-off**: Engineering + Product Teams
**Blocker for**: Public launch

---

## Day 7: Launch Day Prep (T-1 Day)

### Pre-Launch Meeting (1 hour)
- [ ] Review launch checklist with entire team
- [ ] Assign roles and responsibilities
- [ ] Confirm on-call rotation
- [ ] Review incident response plan
- [ ] Confirm communication schedule
- [ ] Do final "go/no-go" decision

### Final Deployment Dry Run (2 hours)
- [ ] Run full deployment to staging
- [ ] Verify rollback procedure works
- [ ] Test database migration (if any)
- [ ] Verify edge functions deploy correctly
- [ ] Check all environment variables
- [ ] Run `./scripts/staging-smoke-tests.sh` one final time

### Launch Day Preparation (1-2 hours)
- [ ] Schedule deployment for off-peak hours (early morning recommended)
- [ ] Prepare monitoring dashboard (open `/system-health` in browser)
- [ ] Set up team communication channel (Slack, Discord)
- [ ] Prepare launch announcement (ready to publish)
- [ ] Queue social media posts
- [ ] Prepare support email templates
- [ ] Set up support ticketing system (if not done)
- [ ] Get plenty of rest! 😴

**Sign-off**: Entire Team
**Blocker for**: Launch Day

---

## Launch Day (T-0) 🚀

### Pre-Launch (Before deployment)
- [ ] **T-1 hour**: Team assembles, final go/no-go
- [ ] **T-30 min**: Open monitoring dashboards
- [ ] **T-15 min**: Begin deployment
- [ ] **T-10 min**: Monitor deployment progress
- [ ] **T-5 min**: Run smoke tests

### Go Live (Deployment complete)
- [ ] **T+0 min**: Verify site is live
- [ ] **T+5 min**: Run quick manual test of critical flows
- [ ] **T+10 min**: Check error logs (should be zero)
- [ ] **T+15 min**: Publish launch announcement
- [ ] **T+30 min**: Monitor for first users
- [ ] **T+1 hour**: Send email to beta testers
- [ ] **T+2 hours**: Post on social media
- [ ] **T+4 hours**: Check metrics (signups, errors, performance)
- [ ] **T+8 hours**: First on-call shift ends (brief next shift)

### Post-Launch Monitoring (First 72 hours)
- [ ] Monitor error logs every 2 hours
- [ ] Check performance metrics every 4 hours
- [ ] Review user feedback daily
- [ ] Respond to support requests within 4 hours
- [ ] Daily standup with team (first 3 days)
- [ ] Document issues and lessons learned

**Sign-off**: On-call Team
**Success Criteria**: 
- Zero critical errors in first 24 hours
- <5 high-priority bugs reported in first 72 hours
- Response time <3s (p95) maintained
- Zero data breaches or security incidents
- >80% user satisfaction (from feedback widget)

---

## Post-Launch (Week 1)

### Day 2 Post-Launch
- [ ] Review first 24 hours metrics
- [ ] Address any reported bugs
- [ ] Monitor performance trends
- [ ] Check database usage and scaling

### Day 4 Post-Launch
- [ ] Review first 72 hours metrics
- [ ] Conduct team retrospective
- [ ] Document lessons learned
- [ ] Plan bug fixes for Week 2

### Day 7 Post-Launch
- [ ] Conduct one-week retrospective
- [ ] Review user feedback themes
- [ ] Plan feature improvements
- [ ] Update roadmap based on learnings
- [ ] Celebrate launch success! 🎉

---

## Emergency Contacts

### On-Call Rotation (First 72 hours)
- **Shift 1 (00:00-08:00)**: [Name, Phone, Email]
- **Shift 2 (08:00-16:00)**: [Name, Phone, Email]
- **Shift 3 (16:00-00:00)**: [Name, Phone, Email]

### Escalation Path
1. **Level 1**: On-call engineer (all incidents)
2. **Level 2**: Engineering lead (if unresolved in 1 hour)
3. **Level 3**: CTO (if critical and unresolved in 2 hours)
4. **Level 4**: CEO (if data breach or legal issue)

### External Contacts
- **Supabase Support**: support@supabase.com (if backend issues)
- **DNS Provider**: [Cloudflare, etc.]
- **Legal Counsel**: [Name, Phone] (for compliance issues)
- **PR Contact**: [Name, Email] (for media inquiries)

---

## Launch Success Criteria

### Technical Metrics
- [ ] Uptime: >99.5% in first week
- [ ] Error rate: <10 errors/hour average
- [ ] Performance: Lighthouse score >85 on all key pages
- [ ] Security: Zero critical vulnerabilities, zero breaches

### Business Metrics
- [ ] Beta testers converted: >50%
- [ ] Day 1 signups: [Target TBD based on beta]
- [ ] Week 1 active users: [Target TBD]
- [ ] User satisfaction: >4/5 stars average

### Qualitative Metrics
- [ ] No showstopper bugs reported
- [ ] Positive feedback from early users
- [ ] Team morale is high
- [ ] Incident response worked smoothly (if any incidents)

---

**Last Updated**: 2025-01-17  
**Owner**: Product / Engineering Team  
**Review Frequency**: Daily during launch week, then weekly for Month 1
