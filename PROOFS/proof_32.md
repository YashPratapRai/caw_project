Title: Route Namespace Isolation — /r/ Prefix for Redirects
Demonstrated: Redirect routes use /r/:code prefix, separating public redirect traffic from authenticated /links, /health, and /metrics endpoints
Technical detail: RedirectController is mounted at @Controller('r'), meaning all redirects go through /r/:code. This prevents short codes from colliding with API routes (e.g., a code "health" won't conflict with GET /health) and allows different rate limit and auth policies per namespace.
Proof: GET /r/health → 302 redirect (if a link with code "health" exists). GET /health → 200 {"status":"ok"} — no collision.
Reasoning: Namespace isolation is the same pattern used by bit.ly (/redirect/) and GitHub (/blob/ vs /tree/) to prevent route ambiguity as the API surface grows.
