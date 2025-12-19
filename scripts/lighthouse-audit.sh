#!/bin/bash

# Lighthouse Audit Script
# Runs Lighthouse on key pages and generates reports

set -e

echo "🔍 Inner Odyssey - Lighthouse Audit"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5173}"
OUTPUT_DIR="lighthouse-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Pages to audit
PAGES=(
  "/"
  "/login"
  "/signup"
  "/features"
  "/pricing"
  "/about"
)

# Thresholds
PERF_THRESHOLD=90
A11Y_THRESHOLD=90
BP_THRESHOLD=90
SEO_THRESHOLD=90

echo "Base URL: $BASE_URL"
echo "Output: $OUTPUT_DIR"
echo ""

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
  echo "Installing Lighthouse CLI..."
  npm install -g lighthouse
fi

# Run audits
TOTAL_PAGES=${#PAGES[@]}
PASSED=0
FAILED=0

for PAGE in "${PAGES[@]}"; do
  URL="${BASE_URL}${PAGE}"
  FILENAME="${OUTPUT_DIR}/lighthouse_${PAGE//\//_}_${TIMESTAMP}"
  
  echo "Auditing: $URL"
  
  # Run Lighthouse
  lighthouse "$URL" \
    --output=html,json \
    --output-path="$FILENAME" \
    --chrome-flags="--headless --no-sandbox" \
    --quiet \
    2>/dev/null || true
  
  # Parse JSON results
  if [ -f "${FILENAME}.report.json" ]; then
    PERF=$(jq '.categories.performance.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    A11Y=$(jq '.categories.accessibility.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    BP=$(jq '.categories["best-practices"].score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    SEO=$(jq '.categories.seo.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    
    # Check thresholds
    PAGE_PASS=true
    
    if [ "$PERF" -lt "$PERF_THRESHOLD" ]; then
      echo -e "  ${RED}❌ Performance: ${PERF}% (threshold: ${PERF_THRESHOLD}%)${NC}"
      PAGE_PASS=false
    else
      echo -e "  ${GREEN}✅ Performance: ${PERF}%${NC}"
    fi
    
    if [ "$A11Y" -lt "$A11Y_THRESHOLD" ]; then
      echo -e "  ${RED}❌ Accessibility: ${A11Y}% (threshold: ${A11Y_THRESHOLD}%)${NC}"
      PAGE_PASS=false
    else
      echo -e "  ${GREEN}✅ Accessibility: ${A11Y}%${NC}"
    fi
    
    if [ "$BP" -lt "$BP_THRESHOLD" ]; then
      echo -e "  ${RED}❌ Best Practices: ${BP}% (threshold: ${BP_THRESHOLD}%)${NC}"
      PAGE_PASS=false
    else
      echo -e "  ${GREEN}✅ Best Practices: ${BP}%${NC}"
    fi
    
    if [ "$SEO" -lt "$SEO_THRESHOLD" ]; then
      echo -e "  ${RED}❌ SEO: ${SEO}% (threshold: ${SEO_THRESHOLD}%)${NC}"
      PAGE_PASS=false
    else
      echo -e "  ${GREEN}✅ SEO: ${SEO}%${NC}"
    fi
    
    if [ "$PAGE_PASS" = true ]; then
      ((PASSED++))
    else
      ((FAILED++))
    fi
  else
    echo -e "  ${YELLOW}⚠️ Could not generate report${NC}"
    ((FAILED++))
  fi
  
  echo ""
done

# Summary
echo "===================================="
echo "Summary"
echo "===================================="
echo -e "Total Pages: $TOTAL_PAGES"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""
echo "Reports saved to: $OUTPUT_DIR/"
echo ""

# Generate summary markdown
SUMMARY_FILE="${OUTPUT_DIR}/SUMMARY_${TIMESTAMP}.md"
cat > "$SUMMARY_FILE" << EOF
# Lighthouse Audit Summary

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Base URL:** $BASE_URL

## Results

| Page | Performance | Accessibility | Best Practices | SEO | Status |
|------|-------------|---------------|----------------|-----|--------|
EOF

for PAGE in "${PAGES[@]}"; do
  FILENAME="${OUTPUT_DIR}/lighthouse_${PAGE//\//_}_${TIMESTAMP}"
  if [ -f "${FILENAME}.report.json" ]; then
    PERF=$(jq '.categories.performance.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    A11Y=$(jq '.categories.accessibility.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    BP=$(jq '.categories["best-practices"].score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    SEO=$(jq '.categories.seo.score * 100' "${FILENAME}.report.json" 2>/dev/null | cut -d. -f1)
    
    if [ "$PERF" -ge "$PERF_THRESHOLD" ] && [ "$A11Y" -ge "$A11Y_THRESHOLD" ] && [ "$BP" -ge "$BP_THRESHOLD" ] && [ "$SEO" -ge "$SEO_THRESHOLD" ]; then
      STATUS="✅ Pass"
    else
      STATUS="❌ Fail"
    fi
    
    echo "| $PAGE | ${PERF}% | ${A11Y}% | ${BP}% | ${SEO}% | $STATUS |" >> "$SUMMARY_FILE"
  fi
done

echo ""
echo "Summary report: $SUMMARY_FILE"

# Exit with error if any failed
if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Lighthouse audit failed. $FAILED page(s) below threshold.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All pages passed Lighthouse audit!${NC}"
  exit 0
fi
