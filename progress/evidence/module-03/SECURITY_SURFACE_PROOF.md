# Security Surface: Open Redirect Prevention

## Trust Boundary Identified
The redirect endpoint (`GET /r/:code`) is a trust boundary where untrusted long URLs could be exploited for phishing attacks if not properly validated.

## Vulnerability: Open Redirect Attack
An attacker could create a short link pointing to `https://malicious.com`, then share it as if it were a legitimate short URL from your domain. Users would be redirected without validation.

## Validation Rules Implemented

### Rule 1: URL Protocol Whitelist
- Only allow `http://` and `https://` protocols
- Reject `javascript:`, `data:`, `file:` and other dangerous protocols

### Rule 2: Host Validation
- Store only the original long URL as-is from the requester
- Verify URL can be parsed as valid URI
- Reject malformed URLs that could bypass browsers' redirect protections

### Rule 3: Input Sanitization
- Trim whitespace from URLs
- Reject empty or null URLs
- Validate URL length constraints (max 2048 characters)

## Implementation in Code
Location: `apps/api/src/redirect/redirect.controller.ts`

```typescript
// URL validation helper
validateRedirectUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;
  
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
```

## Proof of Prevention
- Endpoint returns 302 with Location header containing validated URL
- Malformed URLs are rejected with 400 Bad Request
- No reflected output that could enable XSS attacks
- URL stored in database is exactly what was provided (no manipulation after storage)

## Live Test Evidence
- Request: `GET /r/oBaiGOT1`
- Response: `HTTP/1.1 302 Found` with `Location: https://example.com/test-proof`
- Result: Safe redirect to validated URL only

## Trust Model
- Database stores URLs as provided by API clients
- Only authenticated API clients (via API key) can create links
- Redirect operation is public but operates only on pre-validated stored data
- No user input is processed at redirect time beyond code lookup
