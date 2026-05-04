# LinkOps — System Architecture

## Overview

LinkOps is a production-grade URL shortener API built with NestJS, PostgreSQL, and Redis. It provides secure link creation, public redirects, click analytics, and multi-tenant isolation.

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│              (x-forwarded-proto, x-forwarded-host)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      NestJS API Server                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ RequestLogging    │  │ GlobalException  │  │ ValidationPipe│  │
│  │ Middleware        │  │ Filter           │  │ (whitelist)   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│  ┌────────▼─────────────────────▼────────────────────▼───────┐  │
│  │                    Route Layer                             │  │
│  │                                                            │  │
│  │  /links (ApiKeyGuard + CreateLinkRateLimitGuard)           │  │
│  │  /r/:code (RedirectRateLimitService — no auth)             │  │
│  │  /health (public)                                          │  │
│  │  /metrics (public)                                         │  │
│  └────────┬──────────────────────────────────────────────────┘  │
│           │                                                     │
│  ┌────────▼──────────────────────────────────────────────────┐  │
│  │                   Service Layer                            │  │
│  │                                                            │  │
│  │  LinksService: CRUD, URL validation, code generation       │  │
│  │  RedirectCacheService: In-memory TTL cache                 │  │
│  │  MetricsService: Counter-based operational metrics         │  │
│  │  StructuredLoggerService: JSON logs with secret redaction  │  │
│  │  HealthService: DB + Redis connectivity checks             │  │
│  └────────┬──────────────────────────────────────────────────┘  │
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
   ┌────────▼─────────┐     ┌─────────────────┐
   │  PostgreSQL 16    │     │   Redis 7        │
   │                   │     │                  │
   │  links            │     │  Health check    │
   │  click_events     │     │  (TCP ping)      │
   │  indexes:         │     │                  │
   │  - code (unique)  │     │  Future:         │
   │  - createdBy      │     │  - Redirect cache│
   │  - createdBy+date │     │  - Rate limiting │
   │  - linkId+clicked │     │  - Session store │
   └───────────────────┘     └─────────────────┘
```

## Data Model

### Link
| Field     | Type       | Constraint        | Purpose                           |
|-----------|------------|-------------------|-----------------------------------|
| id        | CUID       | Primary Key       | Internal identifier               |
| code      | String     | Unique Index      | Public short code (8 chars)       |
| longUrl   | String     | Validated URL     | Destination URL                   |
| createdBy | String     | Indexed           | Tenant/owner identifier           |
| createdAt | DateTime   | Default: now()    | Creation timestamp                |
| expiresAt | DateTime?  | Optional          | Auto-expiration timestamp         |
| tags      | String[]   | Max 10, unique    | Categorization labels             |

### ClickEvent
| Field     | Type       | Constraint        | Purpose                           |
|-----------|------------|-------------------|-----------------------------------|
| id        | CUID       | Primary Key       | Event identifier                  |
| linkId    | String     | FK → Link.id      | Parent link (cascade delete)      |
| clickedAt | DateTime   | Default: now()    | Event timestamp                   |
| userAgent | String?    | Max 1024 chars    | Browser/client identification     |
| referrer  | String?    | Max 1024 chars    | Traffic source                    |
| ipHash    | String     | SHA-256 + salt    | Privacy-safe visitor tracking     |

## Scaling Strategy

### Current (Single Instance)
- **In-memory caching**: RedirectCacheService uses a Map with 60s TTL
- **In-memory rate limiting**: Fixed-window counters per IP/tenant
- **Single PostgreSQL**: All reads and writes to one instance

### Future (Horizontal Scale)
- **Redis for caching**: Replace in-memory Map with Redis SET/GET with TTL
- **Redis for rate limiting**: Use Redis INCR with EXPIRE for distributed counters
- **Read replicas**: Route redirect lookups to PostgreSQL read replicas
- **Connection pooling**: Add PgBouncer between API instances and PostgreSQL
- **CDN layer**: Cache 302 responses at the edge for frequently accessed links

## Security Architecture

### Defense in Depth
1. **DTO Layer**: SafeRedirectUrlConstraint validates URL structure, schemes, encoding attacks
2. **Service Layer**: normalizeLongUrl() re-validates and normalizes URLs
3. **Database Layer**: Unique constraints prevent duplicate codes
4. **Transport Layer**: Secret redaction in logs prevents credential leaks

### Threat Model
| Threat                    | Mitigation                                          |
|---------------------------|-----------------------------------------------------|
| Open redirect (phishing)  | Credential-bearing URL rejection, scheme whitelist  |
| XSS via javascript: URLs  | Pre-parse scheme check, protocol whitelist          |
| CRLF injection            | Control character rejection                         |
| Mass assignment           | ValidationPipe whitelist + forbidNonWhitelisted     |
| Brute-force code guessing | Rate limiting on redirect endpoint                  |
| Click inflation           | IP-based rate limiting on redirect path             |
| PII leakage               | IP hashing with configurable salt                   |
| Log credential leaks      | Recursive secret redaction in structured logger     |

## Tradeoffs and Decisions

### 302 vs 301 Redirects
**Chose 302 (Found)** over 301 (Moved Permanently) because short links can be updated, expired, or deleted. A 301 would be cached by browsers indefinitely, preventing link owners from changing destinations.

### In-Memory vs Redis Cache
**Chose in-memory** for initial deployment simplicity. Tradeoff: cache is not shared across instances (each instance has its own cache), but this is acceptable for single-instance deployments. The interface is designed for drop-in Redis replacement.

### API Key vs JWT Authentication
**Chose API key** for machine-to-machine simplicity. JWT would add token expiration, refresh token management, and JWKS rotation complexity that isn't needed for a URL shortener's primary use case (programmatic link creation).

### Random vs Sequential Short Codes
**Chose cryptographically random** (8-char base64url from crypto.randomBytes) over sequential counters. Tradeoff: slight collision risk (handled by retry loop) vs no information leakage about link count or creation order.

### IP Hashing vs Raw Storage
**Chose SHA-256 hashing with salt** for click event IPs. Tradeoff: cannot recover raw IPs for abuse investigation, but compliant with GDPR and privacy regulations. The salt is configurable per deployment.
