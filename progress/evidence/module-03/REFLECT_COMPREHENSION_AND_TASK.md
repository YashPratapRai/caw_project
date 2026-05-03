# Module 03 REFLECT - Comprehension & Practical Answers

## Comprehension Questions

### 1. What core problem does this module solve in core API & CRUD?

This module establishes the foundational public API surface for a short-link service. It solves the problem of translating user-facing short codes into long URLs (redirect functionality) while providing administrative endpoints for link creation and system health monitoring. Without this, there would be no way for clients to create links or for users to follow short links back to their destinations.

### 2. Which decision in this module has the biggest impact, and why?

The decision to use the `/r/{code}` routing prefix for redirects has the biggest impact. This decision creates a hard security and namespace boundary between public redirect traffic and internal APIs (/links, /health). Without this prefix, redirect routes would compete at the root level, creating potential collision bugs and making it harder to reason about which routes handle which security concerns. The prefix ensures scalability as the system grows with new endpoints—any future routes won't accidentally collide with redirect logic.

### 3. What evidence proves the implementation works end-to-end?

Live HTTP responses verify each layer:
- **Request Layer**: Raw HTTP requests with correct headers (x-api-key for authentication)
- **Response Layer**: Correct status codes (201 for creation, 302 for redirects, 200 for health)
- **Data Layer**: Links stored in database with proper validation, code generation, and indexing
- **Integration**: POST /links successfully creates entries that can be retrieved and redirected via GET /r/:code

Evidence files:
- create-valid-response.json: Shows POST /links → 201 with created link object
- redirect-response.txt: Shows GET /r/oBaiGOT1 → 302 with Location header
- health-response.txt: Shows GET /health → 200 with dependency status


## Mini Practical Task - STEP 4 Verification Proof

### Task: Complete one STEP 4 verification action for core API & CRUD and capture proof

**Verification Action**: Test URL validation rejecting credential-bearing URLs (security protection)

**Command**:
```bash
curl -X POST http://localhost:3000/links \
  -H "x-api-key: api-key-1" \
  -H "Content-Type: application/json" \
  -d '{"long_url": "https://good.com@evil.example.com/phishing"}'
```

**Expected Output**: HTTP 422 Unprocessable Entity with validation error message

**Actual Output**:
```json
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "message": "Validation failed",
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "details": [
    {
      "field": "long_url",
      "error": "long_url must be a safe http or https URL."
    }
  ]
}
```

**Proof File**: progress/evidence/module-03/url-validation-proof.txt

**What This Proves**:
1. URL validation is enforced at the DTO level (SafeRedirectUrlConstraint)
2. Credential-bearing URLs that could enable phishing are explicitly rejected
3. The validation error is descriptive and returns 422 (correct status for validation failure)
4. The implementation successfully prevents the specific attack vector of embedding credentials in URLs


## Risk & Mitigation from This Module

**Risk**: Without authentication on POST /links, any user could create links pointing to malicious URLs, turning the service into a phishing vector.

**Mitigation**: Implemented API key authentication via x-api-key header. All link creation requires a valid API key that maps to a principal_id. The principal_id is stored as created_by, creating an audit trail. Additionally, URL validation enforces protocol whitelisting and rejects credentials-bearing URLs at the validator level.

---

Status: Module 03 REFLECT comprehension complete and mini task verified.
