Title: Expires-At Validation — Future Date Required
Demonstrated: POST /links rejects expires_at values that are in the past
Technical detail: LinksService.createShortLink() checks `if (expiresAt && expiresAt <= new Date())` and throws BadRequestException "expires_at must be in the future." The date is parsed via parseOptionalDate() which validates ISO-8601 format first.
Proof: POST /links with expires_at:"2020-01-01T00:00:00Z" → HTTP 400 {"error":"expires_at must be in the future."}
Reasoning: Allowing past expiration dates would create links that are immediately expired and unresolvable — a confusing user experience. Validating at creation prevents this dead-on-arrival scenario.
