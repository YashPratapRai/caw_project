Title: Metrics Endpoint — Operational Counters
Demonstrated: GET /metrics returns real-time operational counters for total_requests, total_redirects, rate_limited_requests, cache_hits, and cache_misses
Technical detail: MetricsService maintains in-memory counters incremented by RequestLoggingMiddleware (total_requests), RedirectController (total_redirects), RedirectRateLimitService (rate_limited), and RedirectCacheService (cache hits/misses). MetricsController exposes a snapshot.
Proof: curl http://localhost:3000/metrics → {"total_requests":42,"total_redirects":30,"rate_limited_requests":2,"cache_hits":18,"cache_misses":12}
Reasoning: Counter-based metrics are the foundation for Prometheus/Grafana dashboards. The cache hit ratio (hits / (hits+misses)) directly measures caching effectiveness.
