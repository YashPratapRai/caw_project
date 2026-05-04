Title: API Key Authentication Guard
Demonstrated: Requests without a valid x-api-key header are rejected with 403 Forbidden
Technical detail: ApiKeyGuard reads x-api-key from request headers, validates against a JSON map loaded from API_KEYS env var. On match, it sets request.principal_id for downstream tenant isolation. On failure, canActivate returns false → NestJS returns 403.
Proof: curl -X POST http://localhost:3000/links -H "Content-Type: application/json" -d '{"long_url":"https://example.com"}' → HTTP 403 {"statusCode":403,"message":"Forbidden resource"}
Reasoning: API key auth is simpler than JWT for machine-to-machine traffic and avoids token expiration complexity for a URL shortener's primary use case.
