Title: Tag Normalization — Deduplication and Trimming
Demonstrated: Tags are trimmed, deduplicated, and empty strings are filtered out before storage
Technical detail: LinksService.normalizeTags() maps each tag through trim(), filters out empty strings, and wraps in new Set() for deduplication. Input ["  api ", "api", "", " docs "] becomes ["api", "docs"]. Tags are stored as a PostgreSQL text array.
Proof: POST /links with tags:[" api "," api","","docs"] → Response shows tags:["api","docs"] — trimmed, deduped, no empties.
Reasoning: Normalizing at ingestion prevents downstream confusion (is "api" the same as " api "?) and keeps array indexes and searches consistent. Similar to how GitHub normalizes repository topics.
