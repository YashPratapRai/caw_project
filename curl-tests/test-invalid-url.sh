#!/bin/bash
# curl-tests/test-invalid-url.sh
# Tests: URL validation — expects 400/422 for invalid URLs
# Prerequisites: API server running on localhost:3000

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-api-key-1}"
ALL_PASS=true

test_invalid_url() {
  local description="$1"
  local url="$2"
  local expected_status="$3"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/links" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${API_KEY}" \
    -d "{\"long_url\": \"${url}\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  echo "--- ${description} ---"
  echo "  URL: ${url}"
  echo "  HTTP Status: ${HTTP_CODE} (expected ${expected_status})"
  echo "  Response: ${BODY}"
  
  if [ "$HTTP_CODE" = "$expected_status" ]; then
    echo "  ✅ PASS"
  else
    echo "  ❌ FAIL"
    ALL_PASS=false
  fi
  echo ""
}

echo "=== URL Validation Tests ==="
echo ""

test_invalid_url "Not a URL" "not-a-url" "422"
test_invalid_url "JavaScript scheme" "javascript:alert(1)" "422"
test_invalid_url "Data scheme" "data:text/html,<h1>hi</h1>" "422"
test_invalid_url "File scheme" "file:///etc/passwd" "422"
test_invalid_url "FTP scheme" "ftp://example.com/file" "422"
test_invalid_url "Credential-bearing URL" "https://user:pass@example.com" "422"
test_invalid_url "Credential-bearing phishing" "https://good.com@evil.example.com" "422"
test_invalid_url "Empty URL" "" "422"
test_invalid_url "Encoded javascript scheme" "javascript%3Aalert(1)" "422"
test_invalid_url "Scheme-relative URL" "//evil.com/path" "422"

echo "=== Test: Missing long_url field ==="
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
echo "HTTP Status: ${HTTP_CODE}"
if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
  echo "✅ PASS: Missing field rejected"
else
  echo "❌ FAIL: Expected 400 or 422, got ${HTTP_CODE}"
  ALL_PASS=false
fi

echo ""
echo "=== Test: Unknown field rejection (mass assignment) ==="
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"long_url":"https://example.com","admin":true}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
echo "HTTP Status: ${HTTP_CODE}"
if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
  echo "✅ PASS: Unknown field rejected"
else
  echo "❌ FAIL: Expected 400 or 422, got ${HTTP_CODE}"
  ALL_PASS=false
fi

echo ""
if [ "$ALL_PASS" = true ]; then
  echo "========================================="
  echo "✅ ALL VALIDATION TESTS PASSED"
  echo "========================================="
else
  echo "========================================="
  echo "❌ SOME VALIDATION TESTS FAILED"
  echo "========================================="
  exit 1
fi
