Title: Open Redirect Prevention — JavaScript Scheme Blocking
Demonstrated: URLs using javascript:, data:, or file: schemes are rejected at the DTO layer
Technical detail: SafeRedirectUrlConstraint checks against disallowedSchemePattern (/^(javascript|data|file):/i) before URL parsing, preventing scheme-based XSS attacks even if the URL constructor would accept them. Additionally checks for encoded schemes (%3a) and scheme-relative URLs (//).
Proof: curl -X POST http://localhost:3000/links -H "x-api-key: api-key-1" -d '{"long_url":"javascript:alert(1)"}' → HTTP 422 {"error":"long_url must be a safe http or https URL."}
Reasoning: Pre-parse scheme checks catch encoding bypasses that the URL constructor might normalize silently.
