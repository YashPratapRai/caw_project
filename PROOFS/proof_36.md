Title: Principal ID Length Validation
Demonstrated: Principal IDs longer than 128 characters are rejected with 400 Bad Request
Technical detail: LinksService.requireCurrentUserId() checks `createdBy.length > 128` and throws BadRequestException. This prevents abuse where an attacker sends extremely long principal IDs to consume database storage or exploit downstream systems with buffer assumptions.
Proof: Request with a 200-character principal ID → HTTP 400 {"error":"Principal ID must be 128 characters or fewer."}
Reasoning: Bounding identity string lengths prevents storage amplification attacks and keeps indexes compact. 128 chars accommodates UUIDs (36), emails (254 → truncated), and composite IDs.
