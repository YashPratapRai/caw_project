Title: Unique Code Constraint — Database-Level Enforcement
Demonstrated: The Link model's `code` field has @unique, enforcing uniqueness at the PostgreSQL level
Technical detail: Even if the application-level collision check fails (race condition between two concurrent creates), PostgreSQL's unique constraint on the code column prevents duplicate short codes from being stored. The P2002 error is caught and triggers a retry.
Proof: Two concurrent POST /links with the same generated code → one succeeds with 201, the other retries with a new code and also returns 201. Zero duplicate codes in the database.
Reasoning: Application-level uniqueness checks are inherently racy under concurrency. Database-level constraints provide the authoritative guarantee — the application retry is a performance optimization to avoid exposing the constraint error to clients.
