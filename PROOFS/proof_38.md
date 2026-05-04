Title: URL Normalization — Consistent Storage Format
Demonstrated: Stored URLs are normalized via URL constructor to ensure consistent format
Technical detail: LinksService.normalizeLongUrl() parses the input through `new URL(trimmed)` and stores `parsedUrl.toString()`. This normalizes scheme casing (HTTP → http), default ports (http://example.com:80 → http://example.com), and path encoding consistently.
Proof: POST /links with long_url:"HTTP://EXAMPLE.COM:80/path" → stored as "http://example.com/path" (lowercase scheme, default port removed).
Reasoning: URL normalization prevents duplicate links pointing to the same destination with different representations, saving storage and enabling deduplication queries.
