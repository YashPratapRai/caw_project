import * as fs from 'fs';
import * as path from 'path';

type LogEntry = Record<string, unknown>;
type RedirectAttempt = {
  attempt: number;
  status: number;
  request_id: string | null;
  location: string | null;
};

const outputDir = path.resolve(
  process.cwd(),
  '..',
  '..',
  'progress',
  'evidence',
  'module-06',
);
const outputPath = path.join(outputDir, 'caching-proof.json');

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as LogEntry;
  } catch {
    return null;
  }
}

function readLogs(logPath: string, code: string) {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  return fs
    .readFileSync(logPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter(
      (entry): entry is LogEntry =>
        entry !== null &&
        typeof entry.message === 'string' &&
        (entry.message === 'CACHE_HIT' || entry.message === 'CACHE_MISS') &&
        entry.code === code,
    );
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const createResponse = await fetch('http://localhost:3000/links', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'tenant-cache-proof',
    },
    body: JSON.stringify({
      long_url: 'https://example.com/cache-proof',
    }),
  });

  if (createResponse.status !== 201) {
    throw new Error(`Expected create link to return 201, got ${createResponse.status}`);
  }

  const created = (await createResponse.json()) as { code: string };

  const attempts: RedirectAttempt[] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`http://localhost:3000/r/${created.code}`, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'x-forwarded-for': '198.51.100.70',
      },
    });

    attempts.push({
      attempt,
      status: response.status,
      request_id: response.headers.get('x-request-id'),
      location: response.headers.get('location'),
    });
  }

  const metricsResponse = await fetch('http://localhost:3000/metrics');
  const metrics = await metricsResponse.json();
  const logPath = process.env.CACHING_LOG_PATH;
  const cacheLogs = logPath ? readLogs(logPath, created.code) : [];

  const proof = {
    code: created.code,
    attempts,
    cache_logs: cacheLogs,
    metrics,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

  const hasMiss = cacheLogs.some((entry) => entry.message === 'CACHE_MISS');
  const hitCount = cacheLogs.filter((entry) => entry.message === 'CACHE_HIT').length;
  if (!hasMiss || hitCount < 2) {
    throw new Error('Expected one CACHE_MISS followed by at least two CACHE_HIT logs.');
  }
}

void main();
