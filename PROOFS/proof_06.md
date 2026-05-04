Title: URL Validation — Invalid URL Rejection (422)
Demonstrated: POST /links with a malformed URL returns 422 Unprocessable Entity via class-validator
Technical detail: CreateLinkDto uses @Validate(SafeRedirectUrlConstraint) which checks for valid URL parsing, http/https-only schemes, no embedded credentials, no control characters, and no encoded scheme attacks. The ValidationPipe with whitelist:true and forbidNonWhitelisted:true strips unknown fields.
Proof: curl -X POST http://localhost:3000/links -H "x-api-key: api-key-1" -H "Content-Type: application/json" -d '{"long_url":"not-a-url"}' → HTTP 422 {"error":"long_url must be a safe http or https URL."}
Reasoning: Validation at DTO layer catches bad input before it reaches the service, reducing the attack surface at the earliest boundary.
