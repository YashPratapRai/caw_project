# LinkOps — Production-Grade URL Shortener

A multi-tenant URL shortener API built with **NestJS**, **PostgreSQL**, **Prisma**, and **Redis**. Designed with defense-in-depth security, structured observability, and production-ready patterns.

## Architecture

```
Client → Load Balancer → NestJS API → PostgreSQL + Redis
                              │
                     ┌────────┼────────┐
                     │        │        │
                  Auth    Rate Limit  Cache
                (API Key)  (IP/Tenant) (TTL)
```

## Features

| Feature | Status | Details |
|---------|--------|---------|
| Link CRUD | ✅ | Create, list, get, delete with tenant isolation |
| Short Redirect | ✅ | GET /r/:code → 302 with click tracking |
| API Key Auth | ✅ | Multi-tenant via x-api-key header |
| Rate Limiting | ✅ | Per-tenant (create) + per-IP (redirect) |
| In-Memory Cache | ✅ | 60s TTL with link-expiry awareness |
| Click Analytics | ✅ | User-agent, referrer, hashed IP |
| URL Validation | ✅ | Scheme, credential, encoding attack prevention |
| Structured Logging | ✅ | JSON logs with request_id correlation |
| Secret Redaction | ✅ | Auto-redacts API keys in logs |
| Health Checks | ✅ | DB + Redis dependency-aware status |
| Metrics | ✅ | Counter-based operational metrics |
| DB Timeouts | ✅ | Configurable timeout with 504 fallback |
| Link Expiration | ✅ | Auto-expire with cache-aware enforcement |

## Quick Start

```bash
# 1. Start infrastructure
cd infra && docker compose up -d

# 2. Install dependencies
cd apps/api && npm install

# 3. Run migrations
npx prisma migrate dev

# 4. Start the API
npm run start:dev
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /links | API Key | Create a short link |
| GET | /links | API Key | List your links |
| GET | /links/:id | API Key | Get a specific link |
| DELETE | /links/:id | API Key | Delete a link |
| GET | /r/:code | Public | Redirect to long URL |
| GET | /health | Public | Health check |
| GET | /metrics | Public | Operational metrics |

## Engineering Proofs

This project includes **42 atomic engineering proofs** demonstrating production thinking across security, performance, observability, and system design. Each proof is a self-contained demonstration of a single engineering concept with real observable evidence.

### Top 10 Strongest Proofs

| # | Proof | Category | Key Evidence |
|---|-------|----------|--------------|
| 1 | [Open Redirect Prevention](PROOFS/proof_07.md) | Security | Credential-bearing URLs rejected with 400 |
| 2 | [Rate Limit Bucket Eviction](PROOFS/proof_11.md) | Scaling | LRU eviction prevents unbounded memory growth |
| 3 | [Database Timeout Protection](PROOFS/proof_20.md) | Resilience | 504 on slow queries prevents cascading failures |
| 4 | [Secret Redaction in Logs](PROOFS/proof_16.md) | Security | Recursive key-matching redacts credentials |
| 5 | [Cache Expiry Alignment](PROOFS/proof_40.md) | Correctness | Link expiresAt honored inside cache TTL |
| 6 | [Tenant Isolation](PROOFS/proof_05.md) | Security | Row-level filtering at service layer |
| 7 | [Collision Retry Loop](PROOFS/proof_21.md) | Resilience | 5 retries on P2002 unique violation |
| 8 | [Encoded Scheme Prevention](PROOFS/proof_35.md) | Security | Pre-parse pattern catches encoding bypasses |
| 9 | [Cascade Delete](PROOFS/proof_28.md) | Data Integrity | Link deletion cascades to click events |
| 10 | [Structured JSON Logging](PROOFS/proof_15.md) | Observability | Machine-parseable logs with request_id |

### All Proofs (42 total)

See the [PROOFS/](PROOFS/) directory for the complete set of atomic engineering proofs.

**Categories covered:**
- **Security** (8 proofs): URL validation, open redirect, scheme blocking, auth, tenant isolation, input sanitization, credential redaction, control characters
- **Performance** (6 proofs): Caching, cache invalidation, database indexing, composite indexes, DB timeouts, URL normalization
- **Observability** (5 proofs): Structured logging, secret redaction, request ID propagation, metrics, global exception handling
- **Rate Limiting** (3 proofs): Creation limits, redirect limits, bucket eviction
- **Data Integrity** (5 proofs): Unique constraints, collision retries, cascade deletes, tag normalization, expiration validation
- **Architecture** (5 proofs): Route isolation, proxy awareness, public redirect design, fail-fast config, Docker infrastructure
- **REST Semantics** (3 proofs): 201 Created, 302 Found, 204 No Content
- **Analytics** (2 proofs): Click event recording, IP hashing
- **Scaling** (5 proofs): Memory-safe rate limiting, TTL-based cache, configurable timeouts, index-optimized queries, link expiry in cache

## Documentation

- [Architecture & System Design](docs/architecture.md) — Full system design, scaling strategy, threat model, and tradeoff decisions
- [Example Structured Logs](logs/example-logs.txt) — Sample log output for all major scenarios

## Curl Test Scripts

```bash
# Run all tests (requires API server running)
bash curl-tests/test-create-link.sh     # 201 Created
bash curl-tests/test-redirect.sh        # 302 Found
bash curl-tests/test-rate-limit.sh      # 429 Too Many Requests
bash curl-tests/test-invalid-url.sh     # 422 Unprocessable Entity
bash curl-tests/test-auth.sh            # 403 Forbidden
bash curl-tests/test-health.sh          # 200 OK
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | Yes | — | API server port |
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| API_KEYS | Yes | — | JSON map of API key → principal ID |
| REDIS_URL | No | — | Redis connection for health checks |
| IP_HASH_SALT | No | dev-ip-hash-salt | Salt for IP address hashing |
| DB_TIMEOUT_MS | No | 2500 | Database query timeout |
| REDIRECT_RATE_LIMIT_MAX | No | 60 | Max redirect requests per window |
| REDIRECT_RATE_LIMIT_WINDOW_MS | No | 60000 | Rate limit window duration |
| REDIRECT_RATE_LIMIT_MAX_KEYS | No | 10000 | Max rate limit buckets in memory |

## License

Private — All rights reserved.
