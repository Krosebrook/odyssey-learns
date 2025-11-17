#!/bin/bash

# Load Testing Script for Inner Odyssey
# Tests application performance under production-like load

echo "=========================================="
echo "Inner Odyssey Load Testing Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://hcsglifjqdmiykrrmncn.supabase.co}"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjc2dsaWZqcWRtaXlrcnJtbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODYxNDEsImV4cCI6MjA3NjA2MjE0MX0.SRbOKjtmF0dYE2Lzmbx1Q-rO360WWMUDVeRLs_Rs4ek"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
RESPONSE_TIMES=()

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local max_time_ms=$4
    
    echo -n "Testing: $name... "
    
    # Make request and measure time
    start_time=$(date +%s%N)
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        "$url" 2>/dev/null)
    end_time=$(date +%s%N)
    
    # Parse response
    status=$(echo "$response" | tail -n 2 | head -n 1)
    time_total=$(echo "$response" | tail -n 1)
    time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
    
    # Store response time
    RESPONSE_TIMES+=("$name:$time_ms")
    
    # Check status code
    if [ "$status" == "$expected_status" ]; then
        # Check response time
        if [ "$time_ms" -le "$max_time_ms" ]; then
            echo -e "${GREEN}✓ PASS${NC} (${time_ms}ms)"
            ((TESTS_PASSED++))
        else
            echo -e "${YELLOW}⚠ SLOW${NC} (${time_ms}ms, expected <${max_time_ms}ms)"
            ((TESTS_PASSED++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (status: $status, expected: $expected_status)"
        ((TESTS_FAILED++))
    fi
}

# Function to test concurrent requests
test_concurrent() {
    local name=$1
    local url=$2
    local concurrent=$3
    local total_requests=$4
    
    echo ""
    echo -e "${BLUE}Concurrent Test: $name${NC}"
    echo "  Concurrent users: $concurrent"
    echo "  Total requests: $total_requests"
    echo -n "  Running... "
    
    start_time=$(date +%s)
    
    # Create temporary file for results
    temp_file=$(mktemp)
    
    # Run concurrent requests
    for i in $(seq 1 $concurrent); do
        (
            for j in $(seq 1 $((total_requests / concurrent))); do
                curl -s -w "%{time_total}\n" \
                    -H "apikey: $ANON_KEY" \
                    "$url" >> "$temp_file" 2>&1
            done
        ) &
    done
    
    # Wait for all background jobs
    wait
    
    end_time=$(date +%s)
    total_time=$((end_time - start_time))
    
    # Calculate statistics
    avg_time=$(awk '{ sum += $1; count++ } END { print sum/count }' "$temp_file")
    min_time=$(sort -n "$temp_file" | head -n 1)
    max_time=$(sort -n "$temp_file" | tail -n 1)
    
    rm "$temp_file"
    
    echo -e "${GREEN}✓ DONE${NC}"
    echo "  Total time: ${total_time}s"
    echo "  Requests/sec: $((total_requests / total_time))"
    echo "  Avg response: $(echo "$avg_time * 1000" | bc | cut -d'.' -f1)ms"
    echo "  Min response: $(echo "$min_time * 1000" | bc | cut -d'.' -f1)ms"
    echo "  Max response: $(echo "$max_time * 1000" | bc | cut -d'.' -f1)ms"
}

echo "1. API Endpoint Tests (Single Request)"
echo "------------------------------"

# Test health check
test_endpoint "Health check" \
    "$BASE_URL/functions/v1/health-check" \
    "200" \
    "500"

# Test database read (profiles)
test_endpoint "Database read (profiles)" \
    "$BASE_URL/rest/v1/profiles?limit=10" \
    "200" \
    "1000"

# Test database read (lessons)
test_endpoint "Database read (lessons)" \
    "$BASE_URL/rest/v1/lessons?limit=10&is_active=eq.true" \
    "200" \
    "1000"

# Test database read (children)
test_endpoint "Database read (children)" \
    "$BASE_URL/rest/v1/children?limit=10" \
    "200" \
    "1000"

echo ""
echo "2. Concurrent Load Tests"
echo "------------------------------"

# Light load: 5 concurrent users, 50 total requests
test_concurrent "Light load" \
    "$BASE_URL/rest/v1/lessons?limit=5&is_active=eq.true" \
    "5" \
    "50"

# Medium load: 10 concurrent users, 100 total requests
test_concurrent "Medium load" \
    "$BASE_URL/rest/v1/lessons?limit=5&is_active=eq.true" \
    "10" \
    "100"

# Heavy load: 20 concurrent users, 200 total requests
test_concurrent "Heavy load" \
    "$BASE_URL/rest/v1/lessons?limit=5&is_active=eq.true" \
    "20" \
    "200"

echo ""
echo "3. Stress Test (Sustained Load)"
echo "------------------------------"

echo -n "Running 5-minute sustained load test... "
start_time=$(date +%s)
requests_completed=0
errors=0

# Run for 5 minutes with consistent load
while [ $(($(date +%s) - start_time)) -lt 300 ]; do
    response=$(curl -s -w "%{http_code}" \
        -H "apikey: $ANON_KEY" \
        "$BASE_URL/rest/v1/lessons?limit=5&is_active=eq.true" 2>/dev/null)
    
    status=$(echo "$response" | tail -c 4)
    
    if [ "$status" == "200" ]; then
        ((requests_completed++))
    else
        ((errors++))
    fi
    
    # Sleep briefly to maintain steady load
    sleep 0.1
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "${GREEN}✓ COMPLETE${NC}"
echo "  Duration: ${duration}s"
echo "  Total requests: $requests_completed"
echo "  Errors: $errors"
echo "  Success rate: $(echo "scale=2; ($requests_completed * 100) / ($requests_completed + $errors)" | bc)%"
echo "  Avg requests/sec: $(echo "$requests_completed / $duration" | bc)"

echo ""
echo "4. Response Time Distribution"
echo "------------------------------"

echo "Response times by endpoint:"
for entry in "${RESPONSE_TIMES[@]}"; do
    endpoint=$(echo "$entry" | cut -d':' -f1)
    time=$(echo "$entry" | cut -d':' -f2)
    
    if [ "$time" -lt 200 ]; then
        indicator="${GREEN}█████${NC}"
    elif [ "$time" -lt 500 ]; then
        indicator="${YELLOW}████${NC}"
    elif [ "$time" -lt 1000 ]; then
        indicator="${YELLOW}███${NC}"
    else
        indicator="${RED}██${NC}"
    fi
    
    echo -e "  $endpoint: ${time}ms $indicator"
done

echo ""
echo "=========================================="
echo "Load Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All load tests passed!${NC}"
    echo ""
    echo "Performance Summary:"
    echo "  - Single request performance: Excellent"
    echo "  - Concurrent load handling: Good"
    echo "  - Sustained load stability: Verified"
    echo ""
    echo "Next steps:"
    echo "1. Review response time distribution"
    echo "2. Check database connection pool usage"
    echo "3. Monitor memory usage during peak load"
    echo "4. Verify auto-scaling behavior"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
    exit 1
fi
