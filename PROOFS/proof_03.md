Title: Health Check Endpoint — Dependency-Aware
Demonstrated: GET /health returns 200 with DB and Redis status independently checked
Technical detail: HealthService runs Promise.all([checkDatabase(), checkRedis()]). DB is verified with a raw `SELECT 1` query under a configurable timeout. Redis is verified with a raw TCP socket connect to avoid requiring a Redis client dependency. Status is "ok" only if both pass, otherwise "degraded".
Proof: curl http://localhost:3000/health → {"status":"ok","dependencies":{"db":"ok","redis":"ok"}}
Reasoning: Independent dependency checks let ops dashboards distinguish between a full outage and a degraded state, enabling targeted remediation.
