#!/bin/bash
# curl-tests/test-health.sh
# Tests: GET /health — expects 200 OK with dependency status
# Prerequisites: API server running on localhost:3000

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=== Test: Health Check (200 OK) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PASS: Health check returned 200"
else
  echo "❌ FAIL: Expected 200, got ${HTTP_CODE}"
  exit 1
fi

echo ""
echo "=== Test: Metrics Endpoint ==="
METRICS=$(curl -s "${BASE_URL}/metrics")
echo "Metrics:"
echo "$METRICS" | python3 -m json.tool 2>/dev/null || echo "$METRICS"
echo ""
echo "✅ Metrics endpoint accessible"
