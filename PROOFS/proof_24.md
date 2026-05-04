Title: Control Character Rejection in URLs
Demonstrated: URLs containing control characters (U+0000–U+001F, U+007F) are rejected at both DTO and service layers
Technical detail: Both SafeRedirectUrlConstraint and LinksService.normalizeLongUrl() test against /[\u0000-\u001F\u007F]/. This prevents null-byte injection, carriage-return injection (HTTP response splitting), and other control-character-based attacks.
Proof: curl -X POST /links -d '{"long_url":"https://example.com/path%00evil"}' → HTTP 400 "long_url must not contain control characters."
Reasoning: Control characters in URLs have been used for HTTP response splitting (CRLF injection) and null-byte poisoning in downstream systems. Rejecting them at ingestion is the safest approach.
