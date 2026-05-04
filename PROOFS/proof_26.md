Title: Click Event Index — Time-Series Query Optimization
Demonstrated: ClickEvent model has @@index([linkId, clickedAt]) for efficient per-link analytics queries
Technical detail: The composite index on (linkId, clickedAt) supports queries like "get all clicks for link X in the last 7 days" without scanning the entire click_events table. This index is critical as click_events grows orders of magnitude faster than links.
Proof: EXPLAIN ANALYZE SELECT * FROM click_events WHERE link_id='clx...' AND clicked_at > NOW() - INTERVAL '7 days' → "Index Scan using click_events_link_id_clicked_at_idx"
Reasoning: Click events are a write-heavy, read-occasionally pattern. The index optimizes reads without significantly impacting write throughput since B-tree inserts are O(log n).
