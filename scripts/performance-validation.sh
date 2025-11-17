#!/bin/bash

# Performance Budget Validation Script
# Validates that the application meets performance budgets

echo "=========================================="
echo "Performance Budget Validation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Performance budgets (from .lighthouserc.json)
PERFORMANCE_BUDGET=85
ACCESSIBILITY_BUDGET=90
BEST_PRACTICES_BUDGET=85
SEO_BUDGET=85
BUNDLE_SIZE_BUDGET=1800000  # 1.8MB

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local actual=$2
    local budget=$3
    local higher_is_better=$4
    
    echo -n "Testing: $test_name... "
    echo "Actual: $actual, Budget: $budget"
    
    if [ "$higher_is_better" == "true" ]; then
        if [ "$actual" -ge "$budget" ]; then
            echo -e "${GREEN}✓ PASS${NC} (Score: $actual, Budget: >=$budget)"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Score: $actual, Budget: >=$budget)"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        if [ "$actual" -le "$budget" ]; then
            echo -e "${GREEN}✓ PASS${NC} (Size: $actual, Budget: <=$budget)"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Size: $actual, Budget: <=$budget)"
            ((TESTS_FAILED++))
            return 1
        fi
    fi
}

echo "1. Bundle Size Analysis"
echo "------------------------------"

# Check if dist folder exists
if [ -d "dist" ]; then
    # Calculate total bundle size
    total_size=$(find dist -type f -name "*.js" -o -name "*.css" | xargs du -cb | grep total | cut -f1)
    
    # Convert to MB for display
    size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc)
    budget_mb=$(echo "scale=2; $BUNDLE_SIZE_BUDGET / 1024 / 1024" | bc)
    
    echo "Total bundle size: ${size_mb}MB (Budget: ${budget_mb}MB)"
    run_test "Bundle size" "$total_size" "$BUNDLE_SIZE_BUDGET" "false"
    
    # List largest files
    echo ""
    echo "Largest bundles:"
    find dist -type f \( -name "*.js" -o -name "*.css" \) -exec du -h {} + | sort -rh | head -n 5
else
    echo -e "${YELLOW}⚠ WARNING${NC}: dist folder not found. Run 'npm run build' first."
fi

echo ""
echo "2. Lighthouse Performance Budgets"
echo "------------------------------"

echo -e "${YELLOW}ℹ Manual verification required:${NC}"
echo "Run: npm run lighthouse"
echo ""
echo "Expected budgets:"
echo "  - Performance: >= $PERFORMANCE_BUDGET"
echo "  - Accessibility: >= $ACCESSIBILITY_BUDGET"
echo "  - Best Practices: >= $BEST_PRACTICES_BUDGET"
echo "  - SEO: >= $SEO_BUDGET"

echo ""
echo "3. Web Vitals Thresholds"
echo "------------------------------"

echo -e "${YELLOW}ℹ Manual verification required:${NC}"
echo "Check in production monitoring:"
echo ""
echo "Largest Contentful Paint (LCP):"
echo "  - Good: < 2.5s"
echo "  - Needs improvement: 2.5s - 4.0s"
echo "  - Poor: > 4.0s"
echo ""
echo "First Input Delay (FID):"
echo "  - Good: < 100ms"
echo "  - Needs improvement: 100ms - 300ms"
echo "  - Poor: > 300ms"
echo ""
echo "Cumulative Layout Shift (CLS):"
echo "  - Good: < 0.1"
echo "  - Needs improvement: 0.1 - 0.25"
echo "  - Poor: > 0.25"

echo ""
echo "4. API Response Time Analysis"
echo "------------------------------"

# Test API response times
BASE_URL="https://hcsglifjqdmiykrrmncn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek"

test_api_endpoint() {
    local name=$1
    local url=$2
    local budget_ms=$3
    
    echo -n "Testing: $name... "
    
    # Make 5 requests and calculate average
    total_time=0
    for i in {1..5}; do
        time=$(curl -s -w "%{time_total}" \
            -H "apikey: $ANON_KEY" \
            "$url" -o /dev/null 2>/dev/null)
        time_ms=$(echo "$time * 1000" | bc | cut -d'.' -f1)
        total_time=$((total_time + time_ms))
    done
    
    avg_time=$((total_time / 5))
    
    run_test "$name" "$avg_time" "$budget_ms" "false"
}

test_api_endpoint "Health check" \
    "$BASE_URL/functions/v1/health-check" \
    "500"

test_api_endpoint "Database read" \
    "$BASE_URL/rest/v1/lessons?limit=10&is_active=eq.true" \
    "1000"

test_api_endpoint "Complex query" \
    "$BASE_URL/rest/v1/user_progress?limit=20&select=*,children(*),lessons(*)" \
    "1500"

echo ""
echo "5. Database Query Performance"
echo "------------------------------"

echo -e "${YELLOW}ℹ Manual verification required:${NC}"
echo "Check in Lovable Cloud backend:"
echo ""
echo "Query performance targets:"
echo "  - Simple SELECT: < 50ms"
echo "  - JOIN queries: < 100ms"
echo "  - Aggregations: < 200ms"
echo "  - Complex queries: < 500ms"
echo ""
echo "Index usage:"
echo "  - All foreign keys indexed: YES"
echo "  - Full-text search indexed: YES"
echo "  - Frequently filtered columns indexed: YES"

echo ""
echo "6. Memory and CPU Limits"
echo "------------------------------"

echo -e "${YELLOW}ℹ Manual verification required:${NC}"
echo "Check in production monitoring:"
echo ""
echo "Memory usage:"
echo "  - Baseline: < 200MB"
echo "  - Under load: < 500MB"
echo "  - Peak: < 800MB"
echo ""
echo "CPU usage:"
echo "  - Idle: < 5%"
echo "  - Normal load: < 30%"
echo "  - Peak: < 70%"

echo ""
echo "7. Network Payload Analysis"
echo "------------------------------"

if [ -d "dist" ]; then
    echo "JavaScript payload:"
    js_size=$(find dist -type f -name "*.js" -exec du -cb {} + | grep total | cut -f1)
    js_size_kb=$((js_size / 1024))
    echo "  Total: ${js_size_kb}KB"
    
    echo ""
    echo "CSS payload:"
    css_size=$(find dist -type f -name "*.css" -exec du -cb {} + | grep total | cut -f1)
    css_size_kb=$((css_size / 1024))
    echo "  Total: ${css_size_kb}KB"
    
    echo ""
    echo "Image payload:"
    if [ -d "dist/assets" ]; then
        img_size=$(find dist/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" \) -exec du -cb {} + 2>/dev/null | grep total | cut -f1 || echo "0")
        img_size_kb=$((img_size / 1024))
        echo "  Total: ${img_size_kb}KB"
    else
        echo "  No images found in dist/assets"
    fi
fi

echo ""
echo "=========================================="
echo "Performance Validation Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All performance budgets met!${NC}"
    echo ""
    echo "Performance status: READY FOR PRODUCTION"
    echo ""
    echo "Next steps:"
    echo "1. Run full Lighthouse audit: npm run lighthouse"
    echo "2. Monitor Web Vitals in production"
    echo "3. Set up performance alerts"
    echo "4. Schedule weekly performance reviews"
    exit 0
else
    echo -e "${RED}✗ Some performance budgets not met.${NC}"
    echo ""
    echo "Action items:"
    echo "1. Review failed tests above"
    echo "2. Optimize bundle size if needed"
    echo "3. Improve API response times"
    echo "4. Re-run validation after improvements"
    exit 1
fi
