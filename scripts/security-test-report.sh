#!/bin/bash

# Security Test Report Generator
# Aggregates security test results and generates markdown report
# Part of Phase 9: Security & Testing Polish

set -e

# Ensure we're in the project root
cd "$(dirname "$0")/.."

echo "🔒 Security Test Report Generator"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Run security tests
echo "Running security test suites..."
npx playwright test e2e/security*.spec.ts --reporter=json > security-test-results.json || true

# Parse results
TOTAL_TESTS=$(jq '.suites | map(.specs | length) | add' security-test-results.json 2>/dev/null || echo "0")
PASSED_TESTS=$(jq '[.suites[].specs[].tests[] | select(.status == "passed")] | length' security-test-results.json 2>/dev/null || echo "0")
FAILED_TESTS=$(jq '[.suites[].specs[].tests[] | select(.status == "failed")] | length' security-test-results.json 2>/dev/null || echo "0")
SKIPPED_TESTS=$(jq '[.suites[].specs[].tests[] | select(.status == "skipped")] | length' security-test-results.json 2>/dev/null || echo "0")

# Calculate pass rate
if [ "$TOTAL_TESTS" -gt 0 ]; then
  PASS_RATE=$(echo "scale=2; ($PASSED_TESTS / $TOTAL_TESTS) * 100" | bc)
else
  PASS_RATE=0
fi

# Generate markdown report
REPORT_FILE="security-test-report.md"

cat > "$REPORT_FILE" << EOF
# 🔒 Security Test Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')

## Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | $TOTAL_TESTS |
| **Passed** | ✅ $PASSED_TESTS |
| **Failed** | ❌ $FAILED_TESTS |
| **Skipped** | ⏭️  $SKIPPED_TESTS |
| **Pass Rate** | ${PASS_RATE}% |

## Test Suites

### 1. RLS Policy Security Tests
Tests that Row Level Security policies prevent unauthorized data access.

EOF

# Add RLS test results
jq -r '.suites[] | select(.file | contains("security-rls")) | .specs[] | .tests[] | "- [\(.status | ascii_upcase)] \(.title)"' security-test-results.json 2>/dev/null >> "$REPORT_FILE" || echo "- No RLS tests found" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### 2. Error Log Security Tests
Tests that error logging is protected against spam and injection attacks.

EOF

jq -r '.suites[] | select(.file | contains("security-error-logging")) | .specs[] | .tests[] | "- [\(.status | ascii_upcase)] \(.title)"' security-test-results.json 2>/dev/null >> "$REPORT_FILE" || echo "- No error logging tests found" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### 3. Analytics Access Control Tests
Tests that analytics data is properly restricted by role.

EOF

jq -r '.suites[] | select(.file | contains("security-analytics")) | .specs[] | .tests[] | "- [\(.status | ascii_upcase)] \(.title)"' security-test-results.json 2>/dev/null >> "$REPORT_FILE" || echo "- No analytics tests found" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### 4. Authentication Security Tests
Tests for auth bypass, session hijacking, and privilege escalation.

EOF

jq -r '.suites[] | select(.file | contains("security.spec")) | .specs[] | .tests[] | "- [\(.status | ascii_upcase)] \(.title)"' security-test-results.json 2>/dev/null >> "$REPORT_FILE" || echo "- No auth tests found" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

## Failed Tests Details

EOF

# Add failed test details
FAILED_COUNT=$(jq '[.suites[].specs[].tests[] | select(.status == "failed")] | length' security-test-results.json 2>/dev/null || echo "0")

if [ "$FAILED_COUNT" -gt 0 ]; then
  jq -r '.suites[].specs[].tests[] | select(.status == "failed") | "### ❌ \(.title)\n\n**Error:** \(.results[0].error.message // "Unknown error")\n\n**File:** \(.location.file):\(.location.line)\n"' security-test-results.json 2>/dev/null >> "$REPORT_FILE"
else
  echo "No failed tests! ✅" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## Recommendations

EOF

if [ "$PASS_RATE" == "100.00" ]; then
  echo "✅ All security tests passing. Continue monitoring." >> "$REPORT_FILE"
elif (( $(echo "$PASS_RATE >= 95" | bc -l) )); then
  echo "⚠️ Pass rate above 95%. Review and fix failed tests before deployment." >> "$REPORT_FILE"
elif (( $(echo "$PASS_RATE >= 80" | bc -l) )); then
  echo "❌ Pass rate below 95%. **BLOCK DEPLOYMENT** until fixed." >> "$REPORT_FILE"
else
  echo "🚨 CRITICAL: Pass rate below 80%. **DO NOT DEPLOY**. Immediate action required." >> "$REPORT_FILE"
fi

# Print summary to console
echo ""
echo "=================================="
echo "Test Results Summary"
echo "=================================="
echo -e "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
echo -e "${YELLOW}Skipped:       $SKIPPED_TESTS${NC}"
echo -e "Pass Rate:     ${PASS_RATE}%"
echo ""
echo "Full report saved to: $REPORT_FILE"
echo ""

# Exit with error if pass rate below 95%
if (( $(echo "$PASS_RATE < 95" | bc -l) )); then
  echo -e "${RED}❌ Security tests failed. Pass rate below 95%.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Security tests passed!${NC}"
  exit 0
fi
