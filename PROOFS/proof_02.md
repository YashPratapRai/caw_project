Title: Redirect Resolution — 302 Found
Demonstrated: GET /r/:code returns 302 with Location header pointing to the original long URL
Technical detail: RedirectController looks up the code via LinksService.resolveLinkForRedirect, checks expiry, records a ClickEvent, then calls response.redirect(302, link.longUrl). The 302 status allows browsers and crawlers to follow the redirect without caching it permanently.
Proof: curl -v http://localhost:3000/r/aB3kLm9x → HTTP/1.1 302 Found, Location: https://example.com/
Reasoning: 302 (not 301) chosen deliberately — short links may be updated or expired, so permanent caching would serve stale destinations.
