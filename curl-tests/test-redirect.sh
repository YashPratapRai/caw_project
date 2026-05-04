#!/bin/bash
# curl-tests/test-redirect.sh
# Tests: GET /r/:code — expects 302 Found
# Prerequisites: API server running, at least one link created

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-api-key-1}"

echo "=== Setup: Create a link to redirect ==="

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"long_url": "https://www.google.com"}')

CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$CREATE_CODE" != "201" ]; then
  echo "❌ Setup failed: could not create link (HTTP ${CREATE_CODE})"
  exit 1
fi

SHORT_CODE=$(echo "$CREATE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])" 2>/dev/null)
echo "Created link with code: ${SHORT_CODE}"
echo ""

echo "=== Test: Redirect (302 Found) ==="

REDIRECT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}\n%{redirect_url}" \
  "${BASE_URL}/r/${SHORT_CODE}")

REDIRECT_CODE=$(echo "$REDIRECT_RESPONSE" | head -1)
REDIRECT_URL=$(echo "$REDIRECT_RESPONSE" | tail -1)

echo "HTTP Status: ${REDIRECT_CODE}"
echo "Location: ${REDIRECT_URL}"
echo ""

if [ "$REDIRECT_CODE" = "302" ]; then
  echo "✅ PASS: Redirect returned 302"
else
  echo "❌ FAIL: Expected 302, got ${REDIRECT_CODE}"
  exit 1
fi

echo ""
echo "=== Test: Redirect with verbose headers ==="
curl -v -s -o /dev/null "${BASE_URL}/r/${SHORT_CODE}" 2>&1 | grep -E "< HTTP|< Location|< x-request-id"

echo ""
echo "=== Test: Non-existent code (404) ==="

NOTFOUND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/r/nonexistent_code_12345")

echo "HTTP Status: ${NOTFOUND_CODE}"

if [ "$NOTFOUND_CODE" = "404" ]; then
  echo "✅ PASS: Non-existent code returned 404"
else
  echo "❌ FAIL: Expected 404, got ${NOTFOUND_CODE}"
  exit 1
fi
