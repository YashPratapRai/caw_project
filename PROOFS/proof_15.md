Title: Structured JSON Logging
Demonstrated: All request/response cycles produce structured JSON logs with request_id, method, path, status, and response_time_ms
Technical detail: RequestLoggingMiddleware attaches a randomUUID as x-request-id, measures elapsed time via process.hrtime.bigint(), and emits a structured log via StructuredLoggerService on response 'finish' event. Log fields include principal_id for tenant correlation.
Proof: {"timestamp":"2026-05-03T10:00:00.000Z","level":"info","message":"request.completed","request_id":"550e8400-e29b-41d4-a716-446655440000","method":"POST","path":"/links","status_code":201,"response_time_ms":12.34,"principal_id":"user1"}
Reasoning: Structured JSON logs are machine-parseable by ELK/Datadog/CloudWatch, unlike plain text. The request_id enables distributed tracing across microservices.
