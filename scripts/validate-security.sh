#!/bin/bash

# Security Validation Script
# Pre-launch security checks for Inner Odyssey

set -e

echo "🔒 Inner Odyssey - Security Validation"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
  echo -e "  ${GREEN}✅ $1${NC}"
  ((PASSED++))
}

check_fail() {
  echo -e "  ${RED}❌ $1${NC}"
  ((FAILED++))
}

check_warn() {
  echo -e "  ${YELLOW}⚠️ $1${NC}"
  ((WARNINGS++))
}

# 1. Check for hardcoded secrets
echo "1. Checking for hardcoded secrets..."
SECRETS_FOUND=$(grep -r -E "(password|secret|api_key|apikey|private_key)\s*[:=]\s*['\"][^'\"]+['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "type\|interface\|placeholder\|example" | wc -l || echo "0")
if [ "$SECRETS_FOUND" -eq 0 ]; then
  check_pass "No hardcoded secrets found"
else
  check_fail "Found $SECRETS_FOUND potential hardcoded secrets"
fi

# 2. Check for console.log in production code
echo ""
echo "2. Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test\|spec\|\.test\.\|\.spec\." | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -lt 10 ]; then
  check_pass "Minimal console.log statements ($CONSOLE_LOGS found)"
else
  check_warn "Found $CONSOLE_LOGS console.log statements - review before launch"
fi

# 3. Check for dangerouslySetInnerHTML
echo ""
echo "3. Checking for dangerouslySetInnerHTML..."
DANGEROUS_HTML=$(grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$DANGEROUS_HTML" -eq 0 ]; then
  check_pass "No dangerouslySetInnerHTML usage"
else
  check_warn "Found $DANGEROUS_HTML dangerouslySetInnerHTML usages - verify sanitization"
fi

# 4. Check for eval usage
echo ""
echo "4. Checking for eval() usage..."
EVAL_USAGE=$(grep -r "eval(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$EVAL_USAGE" -eq 0 ]; then
  check_pass "No eval() usage"
else
  check_fail "Found $EVAL_USAGE eval() usages - security risk"
fi

# 5. Check for HTTP URLs (should be HTTPS)
echo ""
echo "5. Checking for insecure HTTP URLs..."
HTTP_URLS=$(grep -r "http://" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "localhost\|127.0.0.1\|http://schemas" | wc -l || echo "0")
if [ "$HTTP_URLS" -eq 0 ]; then
  check_pass "No insecure HTTP URLs"
else
  check_warn "Found $HTTP_URLS HTTP URLs - verify they're intentional"
fi

# 6. Check for security headers file
echo ""
echo "6. Checking security headers..."
if [ -f "public/_headers" ]; then
  if grep -q "X-Frame-Options" public/_headers && grep -q "X-Content-Type-Options" public/_headers; then
    check_pass "Security headers configured"
  else
    check_warn "Security headers file exists but may be incomplete"
  fi
else
  check_fail "No _headers file found"
fi

# 7. Check for TypeScript strict mode
echo ""
echo "7. Checking TypeScript strict mode..."
if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
  check_pass "TypeScript strict mode enabled"
else
  check_warn "TypeScript strict mode not enabled"
fi

# 8. Check for input sanitization imports
echo ""
echo "8. Checking input sanitization usage..."
SANITIZE_IMPORTS=$(grep -r "inputSanitization" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$SANITIZE_IMPORTS" -gt 5 ]; then
  check_pass "Input sanitization used in $SANITIZE_IMPORTS files"
else
  check_warn "Input sanitization only found in $SANITIZE_IMPORTS files"
fi

# 9. Check for Zod validation
echo ""
echo "9. Checking form validation (Zod)..."
ZOD_IMPORTS=$(grep -r "from 'zod'\|from \"zod\"" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$ZOD_IMPORTS" -gt 3 ]; then
  check_pass "Zod validation used in $ZOD_IMPORTS files"
else
  check_warn "Zod validation only found in $ZOD_IMPORTS files"
fi

# 10. Check for session timeout implementation
echo ""
echo "10. Checking session management..."
if [ -f "src/hooks/useSessionTimeout.tsx" ] || [ -f "src/components/auth/SessionTimeoutProvider.tsx" ]; then
  check_pass "Session timeout implemented"
else
  check_fail "Session timeout not implemented"
fi

# 11. Check for RLS policies in migrations
echo ""
echo "11. Checking RLS policy usage..."
RLS_POLICIES=$(grep -r "CREATE POLICY\|ENABLE ROW LEVEL SECURITY" supabase/migrations/ 2>/dev/null | wc -l || echo "0")
if [ "$RLS_POLICIES" -gt 10 ]; then
  check_pass "Found $RLS_POLICIES RLS policy definitions"
else
  check_warn "Only $RLS_POLICIES RLS policies found - verify coverage"
fi

# 12. Check for sensitive data in localStorage
echo ""
echo "12. Checking localStorage usage..."
LOCALSTORAGE=$(grep -r "localStorage\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "selectedChildId\|theme\|onboarding" | wc -l || echo "0")
if [ "$LOCALSTORAGE" -lt 5 ]; then
  check_pass "Minimal localStorage usage for sensitive data"
else
  check_warn "Found $LOCALSTORAGE localStorage usages - verify no sensitive data"
fi

# Summary
echo ""
echo "======================================="
echo "Security Validation Summary"
echo "======================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Security validation FAILED. Fix issues before launch.${NC}"
  exit 1
elif [ "$WARNINGS" -gt 3 ]; then
  echo -e "${YELLOW}⚠️ Security validation passed with warnings. Review before launch.${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Security validation PASSED!${NC}"
  exit 0
fi
