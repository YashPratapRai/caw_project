Title: Link Expiration — Expired Links Return 404
Demonstrated: Expired links are not redirected; GET /r/:code returns 404 for expired links
Technical detail: LinksService.isExpired() checks `link.expiresAt <= new Date()`. In resolveLinkForRedirect(), an expired link is treated identically to a non-existent link — returning 404 "Short code was not found." This prevents leaking the existence of expired resources.
Proof: Create link with expires_at 1 minute in the future. Before expiry: GET /r/:code → 302. After expiry: GET /r/:code → 404 {"error":"Short code was not found."}
Reasoning: Returning 404 (not 410 Gone) for expired links avoids leaking resource existence to unauthenticated callers — a security consideration when short codes might encode tenant information.
