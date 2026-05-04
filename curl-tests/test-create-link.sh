#!/bin/bash
# curl-tests/test-create-link.sh
# Tests: POST /links — expects 201 Created
# Prerequisites: API server running on localhost:3000, valid API key

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-api-key-1}"

echo "=== Test: Create Short Link (201 Created) ==="
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "long_url": "https://github.com/nestjs/nest",
    "tags": ["test", "github"],
    "expires_at": "2027-12-31T23:59:59Z"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ PASS: Link created successfully (201)"
else
  echo "❌ FAIL: Expected 201, got ${HTTP_CODE}"
  exit 1
fi

echo ""
echo "=== Test: Create Link with Tags Deduplication ==="

RESPONSE2=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/links" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "long_url": "https://example.com",
    "tags": [" api ", "api", "", "docs"]
  }')

HTTP_CODE2=$(echo "$RESPONSE2" | tail -1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

echo "HTTP Status: ${HTTP_CODE2}"
echo "Response Body:"
echo "$BODY2" | python3 -m json.tool 2>/dev/null || echo "$BODY2"

if [ "$HTTP_CODE2" = "201" ]; then
  echo "✅ PASS: Link created with normalized tags"
else
  echo "❌ FAIL: Expected 201, got ${HTTP_CODE2}"
  exit 1
fi
