# Routing Surface: Design for Collision Prevention

## Routing Architecture Decision

### Problem
Need to serve:
- Admin/internal API routes: `/links` (POST), `/health` (GET)
- Public redirect routes: `/r/{code}` (GET)

Without careful design, these could collide or interfere with each other.

## Route Collision Analysis

### Potential Collision Points
1. Static route `/links` could collide with `/links/{id}` if one existed
2. Parameter route `/r/:code` must not interfere with static routes
3. Health checks must remain accessible even during high redirect traffic

### Solution: Route Prefix Isolation
- **Internal routes**: `/links`, `/health` (static, no parameters)
- **Public routes**: `/r/{code}` (parameterized, distinct prefix)

### Why This Works
1. **No ambiguity**: Express/NestJS router processes static routes before dynamic ones
2. **No parameter capture**: The `/r/` prefix prevents `/:code` from matching `/links` or `/health`
3. **Clear semantics**: Route prefix immediately indicates route purpose

## Route Priority Order
```
1. /links    → Admin API (POST/GET)
2. /health   → System health (GET)
3. /r/:code  → Public redirects (GET) - catches nothing except /r/*
4. /* (404)  → Not found
```

## Implementation
Location: `apps/api/src/app.module.ts`

```typescript
@Module({
  imports: [
    LinksModule,      // Handles POST /links
    HealthModule,     // Handles GET /health
    RedirectModule,   // Handles GET /r/:code
  ],
})
export class AppModule {}
```

Each module registers its routes independently, preventing cross-contamination.

## Proof of No Collisions
- **Test 1**: `POST /links` → Returns 201 (links endpoint, not /r/:code)
- **Test 2**: `GET /health` → Returns 200 (health endpoint, not /r/:code)
- **Test 3**: `GET /r/oBaiGOT1` → Returns 302 (redirect endpoint)
- **Test 4**: `GET /r/links` → Returns 404 (not matching /links route)
- **Test 5**: `GET /health-redirect` → Returns 404 (not matching /health route)

## Security Boundary Maintained
- Public redirect traffic (potentially high volume) isolated to `/r/*`
- Admin APIs `/links` and `/health` cannot be reached via redirect URLs
- Each route has its own rate limiting and access control

## Tradeoff Analysis
**Chosen**: Route prefix isolation (`/r/{code}`)
- **Pros**: Simple, unambiguous, performs well at scale
- **Cons**: Adds one-character prefix to short URLs

**Rejected**: URL parameter approach (`/:code`)
- Would require guessing or blacklisting static routes
- Could cause maintenance issues if new admin routes added later

**Rejected**: Subdomain routing (`redirect.domain.com`)
- Adds operational complexity (DNS, SSL certificates)
- Unnecessary for single-service application

## Verification
All routes respond correctly as designed, with no interference or collisions detected.
