#!/bin/bash
# curl-tests/test-auth.sh
# Tests: Authentication — expects 403 without valid API key
# Prerequisites: API server running on localhost:3000

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=== Test: No API Key (403 Forbidden) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -d '{"long_url":"https://example.com"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP Status: ${HTTP_CODE}"
echo "Response: ${BODY}"
if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ PASS: No API key returns 403"
else
  echo "❌ FAIL: Expected 403, got ${HTTP_CODE}"
fi

echo ""
echo "=== Test: Invalid API Key (403 Forbidden) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key-12345" \
  -d '{"long_url":"https://example.com"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
echo "HTTP Status: ${HTTP_CODE}"
if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ PASS: Invalid API key returns 403"
else
  echo "❌ FAIL: Expected 403, got ${HTTP_CODE}"
fi

echo ""
echo "=== Test: Valid API Key (201 Created) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: api-key-1" \
  -d '{"long_url":"https://example.com"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
echo "HTTP Status: ${HTTP_CODE}"
if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ PASS: Valid API key returns 201"
else
  echo "❌ FAIL: Expected 201, got ${HTTP_CODE}"
fi

echo ""
echo "=== Test: Redirect without auth (302 — public access) ==="
# First create a link
CREATE_BODY=$(curl -s \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: api-key-1" \
  -d '{"long_url":"https://example.com"}')
CODE=$(echo "$CREATE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])" 2>/dev/null || echo "")

if [ -n "$CODE" ]; then
  REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/r/${CODE}")
  echo "HTTP Status: ${REDIRECT_CODE}"
  if [ "$REDIRECT_CODE" = "302" ]; then
    echo "✅ PASS: Redirect works without API key"
  else
    echo "❌ FAIL: Expected 302, got ${REDIRECT_CODE}"
  fi
else
  echo "⚠️  Skipped: Could not create test link"
fi
