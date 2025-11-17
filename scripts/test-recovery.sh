#!/bin/bash

# Test Recovery Procedure Script
# This script validates the backup recovery process without actually performing a restore

echo "=========================================="
echo "Backup Recovery Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. Database Connectivity Tests"
echo "------------------------------"

# Test database connection
run_test "Database connection" "curl -s -o /dev/null -w '%{http_code}' https://hcsglifjqdmiykrrmncn.supabase.co/rest/v1/ -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek' | grep -q '200'"

# Test critical tables exist
run_test "Profiles table exists" "curl -s https://hcsglifjqdmiykrrmncn.supabase.co/rest/v1/profiles?limit=1 -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek' | grep -q '\['"

run_test "Children table exists" "curl -s https://hcsglifjqdmiykrrmncn.supabase.co/rest/v1/children?limit=1 -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek' | grep -q '\['"

run_test "Lessons table exists" "curl -s https://hcsglifjqdmiykrrmncn.supabase.co/rest/v1/lessons?limit=1 -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek' | grep -q '\['"

echo ""
echo "2. Edge Function Tests"
echo "------------------------------"

# Test backup verification function
run_test "Backup verification function" "curl -s -o /dev/null -w '%{http_code}' https://hcsglifjqdmiykrrmncn.supabase.co/functions/v1/verify-backups -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek' | grep -q '200'"

run_test "Health check function" "curl -s -o /dev/null -w '%{http_code}' https://hcsglifjqdmiykrrmncn.supabase.co/functions/v1/health-check | grep -q '200'"

echo ""
echo "3. Recovery Procedure Validation"
echo "------------------------------"

# Check if backup documentation exists
run_test "Backup recovery plan exists" "test -f docs/BACKUP_RECOVERY_PLAN.md"

run_test "Deployment runbook exists" "test -f docs/DEPLOYMENT_RUNBOOK.md"

# Validate backup schedule configuration
echo -n "Testing: Backup schedule configured... "
if [ -f "docs/BACKUP_RECOVERY_PLAN.md" ]; then
    if grep -q "Daily automated backups" docs/BACKUP_RECOVERY_PLAN.md && grep -q "2 AM UTC" docs/BACKUP_RECOVERY_PLAN.md; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "4. Data Integrity Checks"
echo "------------------------------"

# These would be more comprehensive in production
echo -e "${YELLOW}ℹ Manual verification required:${NC}"
echo "  - Verify backup retention (7 days configured)"
echo "  - Verify PITR window (7 days configured)"
echo "  - Test point-in-time recovery in staging"
echo "  - Verify backup size and completion time"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify backup completion in Lovable Cloud backend"
    echo "2. Test recovery procedure in staging environment"
    echo "3. Document recovery time objectives (RTO)"
    echo "4. Schedule monthly recovery drill"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
