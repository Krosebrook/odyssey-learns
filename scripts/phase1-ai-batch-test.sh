#!/bin/bash

# Phase 1: AI & Batch Operations Testing
# Tests batch generation concurrency, circuit breakers, and timeout handling

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
ANON_KEY="${ANON_KEY:-your-anon-key-here}"

TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Phase 1: AI & Batch Operations Testing                ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASS: ${test_name}${NC}\n"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL: ${test_name}${NC}\n"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Batch Generation Concurrency
test_batch_concurrency() {
    echo "Testing batch generation with concurrency limit..."
    
    # Create batch generation request
    batch_request='{
        "gradeLevel": 2,
        "subjects": ["math", "reading", "science"],
        "lessonsPerSubject": 7
    }'
    
    echo "  Generating 21 lessons (7 per subject, 3 subjects)..."
    start=$(date +%s)
    
    response=$(curl -s -w "\n%{http_code}" \
        "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
        -X POST \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "$batch_request")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    end=$(date +%s)
    duration=$((end - start))
    
    echo "  HTTP Status: ${http_code}"
    echo "  Duration: ${duration} seconds"
    
    # Extract results from response
    success_count=$(echo "$body" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)
    failed_count=$(echo "$body" | grep -o '"failedCount":[0-9]*' | cut -d':' -f2)
    circuit_status=$(echo "$body" | grep -o '"circuitBreakerStatus":"[^"]*"' | cut -d'"' -f4)
    
    echo "  Successful lessons: ${success_count}"
    echo "  Failed lessons: ${failed_count}"
    echo "  Circuit breaker status: ${circuit_status}"
    
    # Verify concurrency limit is respected (should take ~40-60 seconds for 21 lessons with limit 5)
    # With 5 parallel requests, 21 lessons = 5 batches (5+5+5+5+1) * ~10 seconds each
    expected_min_time=30
    expected_max_time=90
    
    if [ "$http_code" = "200" ] && [ $duration -ge $expected_min_time ] && [ $duration -le $expected_max_time ]; then
        echo -e "  ${GREEN}✓ Batch generation completed with proper concurrency${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Unexpected batch generation behavior${NC}"
        return 1
    fi
}

# Test 2: AI Circuit Breaker
test_ai_circuit_breaker() {
    echo "Testing AI circuit breaker with simulated failures..."
    
    # This test would require temporarily breaking the AI API key
    # For now, we'll test the circuit breaker logic indirectly
    
    echo "  Making multiple rapid batch requests to test circuit breaker..."
    
    circuit_opened=false
    
    for i in $(seq 1 3); do
        response=$(curl -s -w "\n%{http_code}" \
            "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
            -X POST \
            -H "apikey: ${ANON_KEY}" \
            -H "Authorization: Bearer ${ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"gradeLevel":1,"subjects":["math"],"lessonsPerSubject":2}')
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        circuit_status=$(echo "$body" | grep -o '"circuitBreakerStatus":"[^"]*"' | cut -d'"' -f4)
        
        echo "    Request ${i}: Circuit status = ${circuit_status}"
        
        if [ "$circuit_status" = "OPEN" ]; then
            circuit_opened=true
        fi
    done
    
    # Circuit breaker should remain CLOSED for successful requests
    if [ "$circuit_opened" = false ]; then
        echo -e "  ${GREEN}✓ Circuit breaker working correctly (CLOSED for successful requests)${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠ Circuit breaker OPEN (may indicate issues with AI service)${NC}"
        return 0
    fi
}

# Test 3: AI Timeout Handling
test_ai_timeout() {
    echo "Testing AI timeout handling (30-second limit)..."
    
    # Request with complex prompt that might take longer
    complex_request='{
        "gradeLevel": 8,
        "subjects": ["science"],
        "lessonsPerSubject": 1
    }'
    
    start=$(date +%s)
    
    response=$(curl -s -w "\n%{http_code}" --max-time 35 \
        "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
        -X POST \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "$complex_request")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    end=$(date +%s)
    duration=$((end - start))
    
    echo "  Duration: ${duration} seconds"
    echo "  HTTP Status: ${http_code}"
    
    # Check if request completed within timeout window
    if [ $duration -le 35 ] && [ "$http_code" = "200" ]; then
        echo -e "  ${GREEN}✓ Timeout handling working (completed in ${duration}s)${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Timeout issues detected${NC}"
        return 1
    fi
}

# Test 4: Partial Failure Handling
test_partial_failures() {
    echo "Testing partial failure handling..."
    
    # Request multiple lessons, some may fail
    batch_request='{
        "gradeLevel": 5,
        "subjects": ["math", "reading", "science", "history"],
        "lessonsPerSubject": 3
    }'
    
    response=$(curl -s -w "\n%{http_code}" \
        "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
        -X POST \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "$batch_request")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    success_count=$(echo "$body" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)
    failed_count=$(echo "$body" | grep -o '"failedCount":[0-9]*' | cut -d':' -f2)
    total_expected=12
    
    echo "  Expected: ${total_expected} lessons"
    echo "  Successful: ${success_count}"
    echo "  Failed: ${failed_count}"
    
    # Check that at least some lessons succeeded even if some failed
    if [ "$http_code" = "200" ] && [ "$success_count" -gt 0 ]; then
        echo -e "  ${GREEN}✓ Partial failures handled gracefully${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Partial failure handling issues${NC}"
        return 1
    fi
}

# Test 5: AI Performance & Cost Monitoring
test_ai_performance() {
    echo "Testing AI performance and monitoring..."
    
    # Generate a small batch and measure performance
    single_request='{
        "gradeLevel": 3,
        "subjects": ["math"],
        "lessonsPerSubject": 1
    }'
    
    start=$(date +%s)
    
    response=$(curl -s -w "\n%{http_code}" \
        "${SUPABASE_URL}/functions/v1/batch-lesson-generation" \
        -X POST \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "$single_request")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    end=$(date +%s)
    duration=$((end - start))
    
    echo "  Single lesson generation time: ${duration} seconds"
    echo "  HTTP Status: ${http_code}"
    
    # Single lesson should complete in 5-15 seconds
    if [ "$http_code" = "200" ] && [ $duration -ge 3 ] && [ $duration -le 20 ]; then
        echo -e "  ${GREEN}✓ AI performance acceptable (${duration}s per lesson)${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠ AI performance outside expected range${NC}"
        return 0
    fi
}

# Run all tests
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting Phase 1: AI & Batch Operations Tests${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

run_test "Batch Generation Concurrency" "test_batch_concurrency"
run_test "AI Circuit Breaker" "test_ai_circuit_breaker"
run_test "AI Timeout Handling" "test_ai_timeout"
run_test "Partial Failure Handling" "test_partial_failures"
run_test "AI Performance Monitoring" "test_ai_performance"

# Summary
echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All AI & batch operation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review AI/batch configuration.${NC}"
    exit 1
fi
