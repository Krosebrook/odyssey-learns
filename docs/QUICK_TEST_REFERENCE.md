# Quick Test Reference Card

**One-page reference for Phase 1 testing**

---

## Setup (30 seconds)

```bash
export SUPABASE_URL="https://hcsglifjqdmiykrrmncn.supabase.co"
export ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek"

chmod +x scripts/*.sh
```

---

## Run Tests

```bash
# All tests (4-6 hours)
./scripts/run-all-phase1-tests.sh

# Individual suites
./scripts/phase1-load-test.sh       # 1-2 hours
./scripts/phase1-database-test.sh   # 30-60 min  
./scripts/phase1-ai-batch-test.sh   # 1-2 hours
```

---

## Success Criteria

| Test | Target | Status |
|------|--------|--------|
| API response | <1000ms | ⏱️ |
| DB queries | <200ms (P95) | ⏱️ |
| Rate limiting | Blocks excess | ✅ / ❌ |
| Idempotency | No duplicates | ✅ / ❌ |
| Circuit breaker | Opens @ 10 | ✅ / ❌ |
| AI batch (21) | 40-60 seconds | ⏱️ |
| Concurrency | Max 5 parallel | ✅ / ❌ |
| Connection pool | <60 connections | ✅ / ❌ |

---

## Quick Fixes

**Connection Failed:**
```bash
curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: ${ANON_KEY}"
```

**Permission Denied:**
```bash
chmod +x scripts/phase1-*.sh
```

**Rate Limit Not Working:**
```bash
# Test RPC directly
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/check_rate_limit" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"test","p_endpoint":"test","p_max_requests":5,"p_window_minutes":1}'
```

---

## After Testing

1. ✅ Fill out `docs/PHASE1_TESTING_REPORT.md`
2. ✅ Update production readiness score
3. ✅ Share results with team
4. ✅ Proceed to Phase 2 or fix issues

---

**Full Documentation:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
