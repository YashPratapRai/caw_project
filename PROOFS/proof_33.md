Title: Link Listing — Owner-Scoped with Descending Sort
Demonstrated: GET /links returns only the authenticated user's links, sorted newest-first
Technical detail: LinksService.listLinksForOwner() queries with `where: { createdBy }` and `orderBy: { createdAt: 'desc' }`. The composite index @@index([createdBy, createdAt(sort: Desc)]) makes this query index-only — no table scan or filesort needed.
Proof: User1 creates 3 links at T1, T2, T3. GET /links with api-key-1 → [{created_at:T3}, {created_at:T2}, {created_at:T1}]. User2's links are not included.
Reasoning: Newest-first ordering matches user expectations for dashboards and reduces time-to-value. The descending index eliminates a reverse sort that PostgreSQL would otherwise perform.
