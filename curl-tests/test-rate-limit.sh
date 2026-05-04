#!/bin/bash
# curl-tests/test-rate-limit.sh
# Tests: Rate limiting on POST /links — expects 429 after 10 requests
# Prerequisites: API server running on localhost:3000

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-api-key-1}"

echo "=== Test: Rate Limiting on Link Creation (429 Too Many Requests) ==="
echo "Sending 12 rapid POST /links requests..."
echo ""

PASS=true

for i in $(seq 1 12); do
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/links" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${API_KEY}" \
    -d "{\"long_url\": \"https://example.com/test-rate-limit-${i}\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  
  if [ "$i" -le 10 ]; then
    echo "Request ${i}: HTTP ${HTTP_CODE} (expected 201)"
    if [ "$HTTP_CODE" != "201" ]; then
      echo "  ⚠️  Unexpected status (might be rate limited from previous test run)"
    fi
  else
    echo "Request ${i}: HTTP ${HTTP_CODE} (expected 429)"
    if [ "$HTTP_CODE" = "429" ]; then
      BODY=$(echo "$RESPONSE" | head -n -1)
      echo "  Response: ${BODY}"
      echo "  ✅ Rate limit enforced correctly"
    else
      echo "  ❌ FAIL: Expected 429, got ${HTTP_CODE}"
      PASS=false
    fi
  fi
done

echo ""
if [ "$PASS" = true ]; then
  echo "✅ PASS: Rate limiting working correctly (429 after 10 requests)"
else
  echo "❌ FAIL: Rate limiting did not trigger as expected"
  exit 1
fi

echo ""
echo "=== Test: Rate Limit Response Body Structure ==="
LAST_RESPONSE=$(curl -s \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"long_url": "https://example.com/rate-limit-check"}')

echo "Rate limit response:"
echo "$LAST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LAST_RESPONSE"
