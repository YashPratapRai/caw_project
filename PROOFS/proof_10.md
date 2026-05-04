Title: Rate Limiting — Redirect Endpoint (60 req/min per IP)
Demonstrated: GET /r/:code returns 429 with Retry-After header after exceeding redirect rate limit
Technical detail: RedirectRateLimitService uses an in-memory fixed-window counter keyed by client IP (x-forwarded-for or direct IP). Window size and max requests are configurable via env vars. The Retry-After header tells clients exactly how long to wait.
Proof: 61st redirect request → HTTP 429 "Too many redirect requests." with Retry-After: 45 header
Reasoning: IP-based limiting on the public redirect path prevents bot-driven click inflation while keeping the endpoint auth-free for legitimate end users.
