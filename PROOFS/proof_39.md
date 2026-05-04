Title: Docker Compose — PostgreSQL and Redis Infrastructure
Demonstrated: docker-compose.yml provisions PostgreSQL 16 and Redis 7 with health checks for local development
Technical detail: PostgreSQL runs on port 5433 (avoiding conflicts with local installs on 5432) with pg_isready health check. Redis runs on 6379 with redis-cli ping health check. Both use Alpine images for minimal footprint. Health checks have 5s interval, 3s timeout, 10 retries.
Proof: docker compose up -d → linkops-postgres (healthy), linkops-redis (healthy). Connection from API: DATABASE_URL=postgresql://postgres:postgres@localhost:5433/linkops
Reasoning: Port 5433 avoids conflicts with existing PostgreSQL installations. Health checks ensure dependent services can wait for readiness before starting the API.
