Title: Cache Invalidation on Link Deletion
Demonstrated: Deleting a link immediately removes it from the redirect cache
Technical detail: LinksService.deleteLinkByIdForOwner() calls this.redirectCacheService.invalidate(link.code) after the Prisma delete succeeds. This ensures that a deleted link cannot be served from cache for up to 60 seconds — the invalidation is synchronous and immediate.
Proof: DELETE /links/:id → 204 No Content. Immediate GET /r/:code → 404 Not Found (not a stale cached 302).
Reasoning: Without explicit invalidation, deleted links would remain redirectable for up to the TTL window — a security concern for links pointing to compromised destinations.
