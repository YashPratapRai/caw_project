Title: User-Agent and Referrer Truncation
Demonstrated: User-Agent and Referrer strings are truncated to 1024 characters before storage
Technical detail: LinksService.normalizeOptionalString() trims whitespace and truncates to 1024 chars via slice(0, 1024). This prevents oversized headers from consuming excessive database storage — a single crafted User-Agent could otherwise be 64KB.
Proof: Request with a 5000-char User-Agent → ClickEvent stored with userAgent of exactly 1024 chars (truncated, not rejected).
Reasoning: Truncation (not rejection) is the correct approach for analytics metadata — the click is still valid, we just don't need the full 5KB User-Agent string. Similar to how Google Analytics truncates custom dimensions.
