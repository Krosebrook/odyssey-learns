# Phase 1 Testing Guide

**Complete guide for running Phase 1 Testing & Validation suite**

---

## Quick Start

```bash
# 1. Set environment variables
export SUPABASE_URL="https://hcsglifjqdmiykrrmncn.supabase.co"
export ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek"

# 2. Make scripts executable
chmod +x scripts/run-all-phase1-tests.sh
chmod +x scripts/phase1-load-test.sh
chmod +x scripts/phase1-database-test.sh
chmod +x scripts/phase1-ai-batch-test.sh

# 3. Run complete test suite
./scripts/run-all-phase1-tests.sh
```

---

## Prerequisites

### System Requirements
- **Bash:** 4.0 or higher
- **curl:** Latest version
- **bc:** For floating-point calculations
- **Internet connection:** To access Supabase API

### Access Requirements
- **Supabase Project:** Must be deployed and accessible
- **Anon Key:** Valid Supabase anonymous key
- **Edge Functions:** All Phase 1 edge functions deployed
- **Database:** All Phase 1 migrations applied

### Installation Check

```bash
# Check bash version
bash --version

# Check curl
curl --version

# Check bc calculator
bc --version

# Test Supabase connectivity
curl -s "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"
```

---

## Test Suites Overview

### Suite 1: Load & Stress Testing
**File:** `scripts/phase1-load-test.sh`  
**Duration:** 1-2 hours  
**Purpose:** Validate application handles production load

**Tests:**
1. ✅ Basic Load Test (5, 10, 20 concurrent users)
2. ✅ Rate Limiting Stress Test (100 rapid requests)
3. ✅ Idempotency & Deduplication (10 duplicate requests)
4. ✅ Error Logging Circuit Breaker (15 rapid errors)
5. ✅ Sustained Load Test (5 minutes at 10 req/sec)

**Success Criteria:**
- API response time <1000ms under load
- Rate limiting blocks excess requests (>0 blocked)
- Idempotency prevents duplicates (≤2 records created)
- Circuit breaker opens after 10 errors
- Sustained load: <500ms avg, <1% failure rate

### Suite 2: Database Performance
**File:** `scripts/phase1-database-test.sh`  
**Duration:** 30-60 minutes  
**Purpose:** Verify index improvements and query optimization

**Tests:**
1. ✅ Baseline Performance Measurement
2. ✅ Query Performance Under Load (50 concurrent)
3. ✅ Complex Query Performance (JOINs, aggregations)
4. ✅ Connection Pool Stress Test (100 rapid connections)
5. ✅ Index Usage Verification

**Success Criteria:**
- All queries <1 second (should be much faster with indexes)
- P95 response time <200ms under load
- Complex queries <200ms
- Connection pool: >95% success rate, <60 max connections
- Index usage >90% on critical queries

### Suite 3: AI & Batch Operations
**File:** `scripts/phase1-ai-batch-test.sh`  
**Duration:** 1-2 hours  
**Purpose:** Validate AI batch generation with concurrency limits

**Tests:**
1. ✅ Batch Generation Concurrency (21 lessons)
2. ✅ AI Circuit Breaker (3 rapid batches)
3. ✅ AI Timeout Handling (30-second limit)
4. ✅ Partial Failure Handling (12 lessons with failures)
5. ✅ AI Performance Monitoring (single lesson)

**Success Criteria:**
- Max 5 parallel AI calls enforced
- 21 lessons complete in 40-60 seconds
- Circuit breaker status reported correctly
- Timeout prevents hanging (all requests <35 seconds)
- Partial results returned on failures
- Single lesson: 5-10 seconds, <$0.10 cost

---

## Running Tests

### Option 1: Run All Tests (Recommended)

```bash
# Complete Phase 1 validation (4-6 hours)
./scripts/run-all-phase1-tests.sh
```

**Output:**
- Real-time test progress
- Pass/fail status for each test
- Summary report with totals
- Next steps based on results

### Option 2: Run Individual Test Suites

```bash
# Load & Stress Testing only (1-2 hours)
./scripts/phase1-load-test.sh

# Database Performance only (30-60 min)
./scripts/phase1-database-test.sh

# AI & Batch Operations only (1-2 hours)
./scripts/phase1-ai-batch-test.sh
```

### Option 3: Custom Test Runs

```bash
# Override default values
export SUPABASE_URL="https://your-project.supabase.co"
export ANON_KEY="your-anon-key"
export BASE_URL="https://your-domain.com"

# Run specific test
./scripts/phase1-load-test.sh
```

---

## Interpreting Results

### Test Output Format

```
[YELLOW] Testing: Test Name
  [Details about test execution]
  [Metrics and measurements]
[GREEN] ✓ PASS: Test Name  OR  [RED] ✗ FAIL: Test Name
```

### Success Indicators

**✅ All Tests Passed:**
```
╔══════════════════════════════════════════════════════════════╗
║                   🎉 ALL TESTS PASSED! 🎉                    ║
╚══════════════════════════════════════════════════════════════╝

✓ Phase 1 critical fixes validated successfully!
✓ Application ready for Phase 2 implementation
```

**Action:** Proceed to Phase 2 or soft launch with beta testers

**⚠️ Some Tests Failed:**
```
╔══════════════════════════════════════════════════════════════╗
║                   ⚠ TESTS FAILED ⚠                           ║
╚══════════════════════════════════════════════════════════════╝

✗ Some Phase 1 tests failed.
⚠ Review failed test output above and fix issues before proceeding.
```

**Action:** Review failures, fix critical issues, re-run tests

---

## Common Issues & Troubleshooting

### Issue 1: Connection Refused

**Symptom:**
```
curl: (7) Failed to connect to localhost port 54321: Connection refused
```

**Solution:**
```bash
# Check if Supabase is running
curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: ${ANON_KEY}"

# Verify URL and key are correct
echo $SUPABASE_URL
echo $ANON_KEY

# Use production URL if local is not available
export SUPABASE_URL="https://hcsglifjqdmiykrrmncn.supabase.co"
```

### Issue 2: Rate Limiting Test False Negative

**Symptom:**
```
✗ Rate limiting not blocking excess requests
```

**Cause:** `check_rate_limit` RPC function not deployed or not working

**Solution:**
```bash
# Test RPC function directly
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/check_rate_limit" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"test","p_endpoint":"test","p_max_requests":5,"p_window_minutes":1}'

# Check for errors in response
# Fix: Re-run Phase 1 database migration
```

### Issue 3: AI Batch Test Timeout

**Symptom:**
```
✗ Timeout issues detected
```

**Cause:** OpenAI/Lovable AI API slow or rate limited

**Solution:**
```bash
# Check API key is set
echo $OPENAI_API_KEY  # or LOVABLE_API_KEY

# Test edge function directly
curl -X POST "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"gradeLevel":1,"subjects":["math"],"lessonsPerSubject":1}'

# Check edge function logs for errors
```

### Issue 4: Database Query Slow

**Symptom:**
```
✗ Some queries are too slow
```

**Cause:** Indexes not created or not being used

**Solution:**
```sql
-- Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Run ANALYZE to update query planner stats
ANALYZE;

-- Check if indexes are being used (requires DB access)
EXPLAIN ANALYZE SELECT * FROM children WHERE parent_id = 'test-id';
```

### Issue 5: Permission Denied

**Symptom:**
```
bash: ./scripts/phase1-load-test.sh: Permission denied
```

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/run-all-phase1-tests.sh
chmod +x scripts/phase1-load-test.sh
chmod +x scripts/phase1-database-test.sh
chmod +x scripts/phase1-ai-batch-test.sh

# Or run with bash directly
bash scripts/phase1-load-test.sh
```

---

## Reporting Results

### Step 1: Fill Out Testing Report

After running tests, document results in:
**File:** `docs/PHASE1_TESTING_REPORT.md`

**Key Sections:**
- Executive Summary (pass/fail, readiness score)
- Test Environment Details (date, versions, users tested)
- Detailed Results for Each Test Suite
- Issues Discovered (P0/P1/P2 priority)
- Performance Benchmarks (actual vs target)
- Production Readiness Assessment
- Recommendations & Next Steps

### Step 2: Update Production Readiness Score

**Before Phase 1:** 3/10 (Critical stability issues)  
**After Phase 1 (if all pass):** 7/10 (Ready for Phase 2)

### Step 3: Communicate Results

**If All Tests Passed:**
- ✅ Share report with stakeholders
- ✅ Schedule soft launch planning meeting
- ✅ Proceed to Phase 2 implementation

**If Tests Failed:**
- ⚠️ Create issues for P0/P1 bugs
- ⚠️ Estimate time to fix critical issues
- ⚠️ Re-schedule testing after fixes

---

## Advanced Usage

### Custom Rate Limits

```bash
# Edit rate limit configs in test scripts
# File: scripts/phase1-load-test.sh

# Line ~85: Change max requests
p_max_requests=10  # Change to your limit
p_window_minutes=1  # Change to your window
```

### Longer Sustained Load Test

```bash
# Edit sustained load duration
# File: scripts/phase1-load-test.sh

# Line ~127: Change duration from 300 seconds (5 min) to 3600 (1 hour)
end_time=$((start_time + 3600))  # 1 hour
```

### Increased Concurrency

```bash
# Edit concurrency limits
# File: scripts/phase1-database-test.sh

# Line ~90: Change from 50 to 100 concurrent requests
request_count=100
```

### AI Batch Size Customization

```bash
# Edit batch sizes
# File: scripts/phase1-ai-batch-test.sh

# Line ~34: Change lessons per subject
lessonsPerSubject=10  # Generate 10 per subject instead of 7
```

---

## CI/CD Integration

### GitHub Actions Workflow

See: `.github/workflows/phase1-testing.yml`

**Triggers:**
- Manual dispatch (`workflow_dispatch`)
- Scheduled: Daily at 2 AM UTC
- On push to `main` branch (optional)

**Environment Secrets Required:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Outputs:**
- Test results summary in workflow logs
- Artifacts: `phase1-test-results.txt`
- Notifications on failure (Slack/email)

---

## Performance Targets Reference

| Metric | Target | Notes |
|--------|--------|-------|
| API Response (P95) | <500ms | Dashboard queries |
| Database Query (P95) | <200ms | With indexes |
| AI Lesson Generation | 5-10s | Single lesson |
| Batch Generation (21 lessons) | 40-60s | With limit=5 |
| Concurrent Users Supported | 500+ | Without failures |
| Rate Limit Enforcement | 100% | Server-side only |
| Connection Pool Max | <60 | Supabase limit |
| Circuit Breaker Opens | After 10 failures | Error logging |
| Idempotency Success | 100% | No duplicates |

---

## Support & Resources

**Documentation:**
- [Phase 1 Completion Status](./PHASE1_COMPLETION_STATUS.md)
- [Phase 1 Testing Report Template](./PHASE1_TESTING_REPORT.md)
- [Production Readiness Checklist](./PRODUCTION_READINESS_CHECKLIST.md)

**Scripts:**
- Master runner: `scripts/run-all-phase1-tests.sh`
- Load testing: `scripts/phase1-load-test.sh`
- Database testing: `scripts/phase1-database-test.sh`
- AI batch testing: `scripts/phase1-ai-batch-test.sh`

**Help:**
- Review script output for detailed error messages
- Check Supabase logs for backend errors
- Re-run individual failed tests for debugging
- Consult troubleshooting section above

---

**Last Updated:** Phase 1 Completion  
**Next Review:** After Phase 2 Implementation
