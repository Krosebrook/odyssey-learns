#!/bin/bash

# Master Test Runner for Phase 1 Testing & Validation
# Runs all three test suites and generates a summary report

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║     PHASE 1: COMPLETE TESTING & VALIDATION SUITE            ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║     Inner Odyssey K-12 - Critical Fixes Validation          ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration check
echo -e "${BLUE}Checking test environment configuration...${NC}"
echo ""

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠ SUPABASE_URL not set. Using default: http://localhost:54321${NC}"
    export SUPABASE_URL="http://localhost:54321"
fi

if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}✗ ANON_KEY not set. Please set ANON_KEY environment variable.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration OK${NC}"
echo -e "  Supabase URL: ${SUPABASE_URL}"
echo -e "  Anon Key: ${ANON_KEY:0:20}...[hidden]"
echo ""

# Test suite status tracking
LOAD_TEST_STATUS="NOT_RUN"
DATABASE_TEST_STATUS="NOT_RUN"
AI_BATCH_TEST_STATUS="NOT_RUN"

# Start time
START_TIME=$(date +%s)

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting Phase 1 Testing Suite${NC}"
echo -e "${BLUE}Estimated Duration: 4-6 hours${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Load & Stress Testing
echo -e "${CYAN}[1/3] Running Load & Stress Testing Suite...${NC}"
echo ""

if bash ./scripts/phase1-load-test.sh; then
    LOAD_TEST_STATUS="PASS"
    echo -e "${GREEN}✓ Load & Stress Testing: PASSED${NC}\n"
else
    LOAD_TEST_STATUS="FAIL"
    echo -e "${RED}✗ Load & Stress Testing: FAILED${NC}\n"
fi

# Test 2: Database Performance Verification
echo -e "${CYAN}[2/3] Running Database Performance Tests...${NC}"
echo ""

if bash ./scripts/phase1-database-test.sh; then
    DATABASE_TEST_STATUS="PASS"
    echo -e "${GREEN}✓ Database Performance Tests: PASSED${NC}\n"
else
    DATABASE_TEST_STATUS="FAIL"
    echo -e "${RED}✗ Database Performance Tests: FAILED${NC}\n"
fi

# Test 3: AI & Batch Operations Testing
echo -e "${CYAN}[3/3] Running AI & Batch Operations Tests...${NC}"
echo ""

if bash ./scripts/phase1-ai-batch-test.sh; then
    AI_BATCH_TEST_STATUS="PASS"
    echo -e "${GREEN}✓ AI & Batch Operations Tests: PASSED${NC}\n"
else
    AI_BATCH_TEST_STATUS="FAIL"
    echo -e "${RED}✗ AI & Batch Operations Tests: FAILED${NC}\n"
fi

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))
SECONDS=$((DURATION % 60))

# Generate Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                     TEST SUMMARY                             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Display results
echo -e "${BLUE}Test Suite Results:${NC}"
echo ""

if [ "$LOAD_TEST_STATUS" = "PASS" ]; then
    echo -e "  ${GREEN}✓${NC} Load & Stress Testing:         ${GREEN}PASSED${NC}"
else
    echo -e "  ${RED}✗${NC} Load & Stress Testing:         ${RED}FAILED${NC}"
fi

if [ "$DATABASE_TEST_STATUS" = "PASS" ]; then
    echo -e "  ${GREEN}✓${NC} Database Performance:          ${GREEN}PASSED${NC}"
else
    echo -e "  ${RED}✗${NC} Database Performance:          ${RED}FAILED${NC}"
fi

if [ "$AI_BATCH_TEST_STATUS" = "PASS" ]; then
    echo -e "  ${GREEN}✓${NC} AI & Batch Operations:         ${GREEN}PASSED${NC}"
else
    echo -e "  ${RED}✗${NC} AI & Batch Operations:         ${RED}FAILED${NC}"
fi

echo ""
echo -e "${BLUE}Total Test Duration:${NC} ${HOURS}h ${MINUTES}m ${SECONDS}s"
echo ""

# Overall status
if [ "$LOAD_TEST_STATUS" = "PASS" ] && [ "$DATABASE_TEST_STATUS" = "PASS" ] && [ "$AI_BATCH_TEST_STATUS" = "PASS" ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   🎉 ALL TESTS PASSED! 🎉                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ Phase 1 critical fixes validated successfully!${NC}"
    echo -e "${GREEN}✓ Application ready for Phase 2 implementation${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Review detailed test logs above"
    echo "  2. Fill out docs/PHASE1_TESTING_REPORT.md with results"
    echo "  3. Update production readiness score"
    echo "  4. Proceed to Phase 2: High Priority Fixes"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                   ⚠ TESTS FAILED ⚠                           ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}✗ Some Phase 1 tests failed.${NC}"
    echo -e "${YELLOW}⚠ Review failed test output above and fix issues before proceeding.${NC}"
    echo ""
    echo -e "${BLUE}Recommended Actions:${NC}"
    echo "  1. Review failed test logs for specific errors"
    echo "  2. Fix critical (P0) and high-priority (P1) issues"
    echo "  3. Re-run failed test suites individually:"
    
    if [ "$LOAD_TEST_STATUS" = "FAIL" ]; then
        echo "     ./scripts/phase1-load-test.sh"
    fi
    if [ "$DATABASE_TEST_STATUS" = "FAIL" ]; then
        echo "     ./scripts/phase1-database-test.sh"
    fi
    if [ "$AI_BATCH_TEST_STATUS" = "FAIL" ]; then
        echo "     ./scripts/phase1-ai-batch-test.sh"
    fi
    
    echo "  4. Re-run full test suite when fixes are complete"
    echo ""
    exit 1
fi
