Title: Link Deletion — Cascade to Click Events
Demonstrated: Deleting a link cascades to all associated ClickEvents via onDelete: Cascade
Technical detail: Prisma schema defines `link Link @relation(fields: [linkId], references: [id], onDelete: Cascade)` on ClickEvent. When a link is deleted, PostgreSQL automatically deletes all associated click events in a single transaction, preventing orphaned rows.
Proof: Link with 50 click events → DELETE /links/:id → 204. SELECT count(*) FROM click_events WHERE link_id=:id → 0 (all cascaded).
Reasoning: Without cascade, deleted links would leave orphaned click events consuming storage indefinitely. Cascade delete ensures referential integrity and matches the "delete everything about this resource" user expectation.
