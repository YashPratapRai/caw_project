Title: Redirect Public Access — No Auth Required
Demonstrated: GET /r/:code works without authentication, enabling public sharing of short links
Technical detail: RedirectController is NOT decorated with @UseGuards(ApiKeyGuard). This is intentional — short links are the shareable product surface. The comment in resolveLinkForRedirect() explicitly documents this design decision: "a public redirect would become unusable if every visitor needed tenant auth."
Proof: curl http://localhost:3000/r/aB3kLm9x (no x-api-key header) → HTTP 302 Location: https://example.com/ — works without authentication.
Reasoning: The redirect endpoint is the consumer-facing product. Requiring auth would break every shared link. Security is maintained by rate limiting and URL validation at creation time, not at redirect time.
