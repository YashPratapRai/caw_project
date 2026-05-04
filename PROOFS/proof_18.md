Title: Request ID Propagation — Distributed Tracing
Demonstrated: Every request gets a UUID request_id attached to both the response header (x-request-id) and all log entries
Technical detail: RequestLoggingMiddleware generates randomUUID(), stores it on the request object via setRequestId(), and sets response header x-request-id. GlobalExceptionFilter reads it via getRequestId() for error correlation. Clients can use this to report issues.
Proof: curl -v POST /links → Response header: x-request-id: 550e8400-e29b-41d4-a716-446655440000. Matching log entry: {"request_id":"550e8400-e29b-41d4-a716-446655440000",...}
Reasoning: Request ID propagation is foundational for distributed tracing (OpenTelemetry pattern). Even in a monolith, it enables log correlation across middleware, guards, and exception filters.
