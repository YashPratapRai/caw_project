import * as fs from 'fs';
import * as path from 'path';

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

const outputDir = path.resolve(
  process.cwd(),
  '..',
  '..',
  'progress',
  'evidence',
  'module-05',
);
const outputPath = path.join(outputDir, 'observability-proof.json');

async function readJsonResponse(response: Response) {
  const text = await response.text();
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: text ? (safeJsonParse(text) ?? text) : null,
  };
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return null;
  }
}

function readStructuredLogs(logPath: string | undefined) {
  if (!logPath || !fs.existsSync(logPath)) {
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const createLink = await fetch('http://localhost:3000/links', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'tenant-observability',
    },
    body: JSON.stringify({
      long_url: 'https://example.com/observability-proof',
    }),
  });

  const createdLink = await readJsonResponse(createLink);
  if (createLink.status !== 201 || !createdLink.body || typeof createdLink.body !== 'object') {
    throw new Error('Unable to create proof link for observability script.');
  }

  const code = (createdLink.body as { code: string }).code;
  const rateLimitIp = '198.51.100.45';
  const redirectAttempts: Array<Record<string, unknown>> = [];

  for (let attempt = 1; attempt <= 65; attempt += 1) {
    const redirectResponse = await fetch(`http://localhost:3000/r/${code}`, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'x-forwarded-for': rateLimitIp,
      },
    });

    redirectAttempts.push({
      attempt,
      status: redirectResponse.status,
      retry_after: redirectResponse.headers.get('retry-after'),
      request_id: redirectResponse.headers.get('x-request-id'),
    });
  }

  const missingHeaderResponse = await fetch('http://localhost:3000/links');
  const notFoundResponse = await fetch('http://localhost:3000/links/not-a-real-id', {
    headers: {
      'x-user-id': 'tenant-observability',
    },
  });
  const healthResponse = await fetch('http://localhost:3000/health');
  const metricsResponse = await fetch('http://localhost:3000/metrics');

  await new Promise((resolve) => setTimeout(resolve, 300));

  const proof = {
    created_link: createdLink,
    redirect_summary: {
      first_three: redirectAttempts.slice(0, 3),
      first_rate_limited: redirectAttempts.find((attempt) => attempt.status === 429) ?? null,
      last_attempt: redirectAttempts.at(-1) ?? null,
    },
    missing_header_error: await readJsonResponse(missingHeaderResponse),
    not_found_error: await readJsonResponse(notFoundResponse),
    health: await readJsonResponse(healthResponse),
    metrics: await readJsonResponse(metricsResponse),
    sample_logs: readStructuredLogs(process.env.OBSERVABILITY_LOG_PATH).slice(-15),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

  const metricsBody = proof.metrics.body as Record<string, unknown> | null;
  if (!proof.redirect_summary.first_rate_limited) {
    throw new Error('Expected at least one rate-limited redirect response.');
  }

  if ((metricsBody?.rate_limited_requests as number | undefined) === undefined) {
    throw new Error('Metrics endpoint did not include rate_limited_requests.');
  }
}

void main();
