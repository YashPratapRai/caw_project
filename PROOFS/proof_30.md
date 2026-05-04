Title: Environment Validation — Fail-Fast on Missing Config
Demonstrated: Application refuses to start without PORT and DATABASE_URL environment variables
Technical detail: main.ts validates PORT is a positive integer and DATABASE_URL is present before calling NestFactory.create(). AuthService validates API_KEYS is present and valid JSON. These checks fail fast at startup rather than failing on the first request.
Proof: Unset DATABASE_URL → node dist/main → throws "Missing DATABASE_URL. Set DATABASE_URL in .env before starting the app." Process exits immediately.
Reasoning: Fail-fast startup validation prevents deploying a misconfigured instance that appears healthy (responds to /health) but fails on actual business requests. This matches the Twelve-Factor App methodology.
