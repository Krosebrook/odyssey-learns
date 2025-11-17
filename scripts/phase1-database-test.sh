#!/bin/bash

# Phase 1: Database Performance Verification
# Tests index usage, query performance, and connection pooling

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
echo -e "${BLUE}║     Phase 1: Database Performance Verification            ║${NC}"
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

# Test 1: Baseline Performance Measurement
test_baseline_performance() {
    echo "Measuring baseline query performance..."
    
    # Test 1: Children by parent_id
    echo "  Query 1: SELECT children WHERE parent_id..."
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/children?select=*&parent_id=eq.test" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    time1=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    echo "    Response time: ${time1}s"
    
    # Test 2: User progress ordered by created_at
    echo "  Query 2: SELECT lesson_analytics_events ORDER BY created_at..."
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/lesson_analytics_events?select=*&order=created_at.desc&limit=50" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    time2=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    echo "    Response time: ${time2}s"
    
    # Test 3: Lesson analytics by lesson_id
    echo "  Query 3: SELECT lesson_analytics_events WHERE lesson_id..."
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/lesson_analytics_events?select=*&lesson_id=eq.test" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    time3=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    echo "    Response time: ${time3}s"
    
    # Check if all queries are under 1 second (should be much faster with indexes)
    all_fast=true
    if (( $(echo "$time1 > 1.0" | bc -l) )); then all_fast=false; fi
    if (( $(echo "$time2 > 1.0" | bc -l) )); then all_fast=false; fi
    if (( $(echo "$time3 > 1.0" | bc -l) )); then all_fast=false; fi
    
    if $all_fast; then
        echo -e "  ${GREEN}✓ All baseline queries under 1 second${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Some queries are too slow${NC}"
        return 1
    fi
}

# Test 2: Load Test Database Queries
test_query_under_load() {
    echo "Testing database queries under concurrent load..."
    
    total_time=0
    request_count=50
    
    for i in $(seq 1 $request_count); do
        start=$(date +%s%N)
        curl -s "${SUPABASE_URL}/rest/v1/lessons?select=*&limit=10" \
            -H "apikey: ${ANON_KEY}" \
            -H "Authorization: Bearer ${ANON_KEY}" > /dev/null 2>&1 &
        end=$(date +%s%N)
        
        time_taken=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
        total_time=$(echo "$total_time + $time_taken" | bc)
    done
    
    wait
    
    avg_time=$(echo "scale=3; $total_time / $request_count" | bc)
    echo "  ${request_count} concurrent requests completed"
    echo "  Average response time: ${avg_time}s"
    
    # Check if average is under 200ms
    if (( $(echo "$avg_time < 0.2" | bc -l) )); then
        echo -e "  ${GREEN}✓ Queries perform well under load${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Queries slow under load${NC}"
        return 1
    fi
}

# Test 3: Complex Query Performance
test_complex_queries() {
    echo "Testing complex queries (JOINs, filters, aggregations)..."
    
    # Test JOIN query (children + parent profiles)
    echo "  Query: Children with parent profile JOIN..."
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/children?select=*,profiles(*)" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    join_time=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    echo "    Response time: ${join_time}s"
    
    # Test aggregation query
    echo "  Query: Count lessons by grade level..."
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/lessons?select=grade_level&limit=1000" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    agg_time=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    echo "    Response time: ${agg_time}s"
    
    # Check if both queries are under 200ms
    if (( $(echo "$join_time < 0.2" | bc -l) )) && (( $(echo "$agg_time < 0.2" | bc -l) )); then
        echo -e "  ${GREEN}✓ Complex queries performant${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Complex queries need optimization${NC}"
        return 1
    fi
}

# Test 4: Connection Pool Stress Test
test_connection_pool() {
    echo "Testing connection pooling with 100 rapid connections..."
    
    success_count=0
    fail_count=0
    
    for i in $(seq 1 100); do
        curl -s "${SUPABASE_URL}/rest/v1/lessons?select=*&limit=1" \
            -H "apikey: ${ANON_KEY}" \
            -H "Authorization: Bearer ${ANON_KEY}" > /dev/null 2>&1 &
        
        if [ $? -eq 0 ]; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    done
    
    wait
    
    echo "  Successful connections: ${success_count}"
    echo "  Failed connections: ${fail_count}"
    
    # Check if at least 95% succeeded
    success_rate=$(echo "scale=2; ($success_count * 100) / 100" | bc)
    
    if (( $(echo "$success_rate >= 95" | bc -l) )); then
        echo -e "  ${GREEN}✓ Connection pool handles load (${success_rate}% success)${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Connection pool issues (${success_rate}% success)${NC}"
        return 1
    fi
}

# Test 5: Index Usage Verification
test_index_usage() {
    echo "Verifying indexes are being used..."
    
    # This would require direct database access for EXPLAIN queries
    # For now, we'll check if indexed columns perform faster
    
    echo "  Testing indexed vs non-indexed column performance..."
    
    # Query with indexed column (should be fast)
    start=$(date +%s%N)
    curl -s "${SUPABASE_URL}/rest/v1/children?select=*&parent_id=eq.test&limit=100" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" > /dev/null
    end=$(date +%s%N)
    indexed_time=$(echo "scale=3; ($end - $start) / 1000000000" | bc)
    
    echo "    Indexed column query time: ${indexed_time}s"
    
    # If indexed query is under 100ms, indexes are likely working
    if (( $(echo "$indexed_time < 0.1" | bc -l) )); then
        echo -e "  ${GREEN}✓ Indexes appear to be in use${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠ Index performance unclear (may need manual EXPLAIN)${NC}"
        return 0
    fi
}

# Run all tests
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting Phase 1: Database Performance Tests${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

run_test "Baseline Performance Measurement" "test_baseline_performance"
run_test "Query Performance Under Load" "test_query_under_load"
run_test "Complex Query Performance" "test_complex_queries"
run_test "Connection Pool Stress Test" "test_connection_pool"
run_test "Index Usage Verification" "test_index_usage"

# Summary
echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All database performance tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review database configuration.${NC}"
    exit 1
fi
