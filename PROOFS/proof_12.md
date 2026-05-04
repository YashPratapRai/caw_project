Title: In-Memory Redirect Cache — TTL-Based Invalidation
Demonstrated: RedirectCacheService caches resolved links for 60 seconds, reducing DB queries on hot redirects
Technical detail: Cache uses a Map<string, RedirectCacheEntry> with a cachedAt timestamp. On get(), entries older than ttlMs (60s) or past their link expiresAt are evicted and treated as misses. Cache hits skip the Prisma query entirely but still record the click event.
Proof: First GET /r/abc → CACHE_MISS log + DB query (12ms). Second GET /r/abc within 60s → CACHE_HIT log (0.3ms). After 60s → CACHE_MISS again.
Reasoning: 60s TTL balances freshness (link deletions propagate within a minute) against DB load reduction. Similar to Cloudflare's edge TTL strategy for short-lived assets.
