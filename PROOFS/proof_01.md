Title: Short Link Creation — 201 Created
Demonstrated: POST /links returns 201 with a valid short code and metadata
Technical detail: NestJS controller delegates to LinksService which generates a cryptographically random 8-char base64url code, stores via Prisma, and returns the link object with a constructed short URL using x-forwarded-* headers for proxy awareness.
Proof: curl -X POST http://localhost:3000/links -H "x-api-key: api-key-1" -H "Content-Type: application/json" -d '{"long_url":"https://example.com"}' → HTTP 201 {"id":"clx...","code":"aB3kLm9x","short_url":"http://localhost:3000/r/aB3kLm9x","long_url":"https://example.com/","created_by":"user1"}
Reasoning: 201 (not 200) signals resource creation per REST semantics; returning the constructed short_url saves clients a second lookup.
