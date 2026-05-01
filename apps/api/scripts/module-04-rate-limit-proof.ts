import * as fs from 'fs';
import * as path from 'path';

type AttemptResult = {
  attempt: number;
  status: number;
  retryAfter: string | null;
  location: string | null;
};

const outputDir = path.resolve(
  process.cwd(),
  '..',
  '..',
  'progress',
  'evidence',
  'module-04',
);
const outputPath = path.join(outputDir, 'rate-limit-proof.json');

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const createResponse = await fetch('http://localhost:3000/links', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'tenant-rate-limit',
    },
    body: JSON.stringify({
      long_url: 'https://example.com/rate-limit-proof',
    }),
  });

  if (createResponse.status !== 201) {
    throw new Error(`Expected link creation to return 201, got ${createResponse.status}`);
  }

  const created = (await createResponse.json()) as { code: string };
  const clientIp = '203.0.113.77';
  const attempts: AttemptResult[] = [];

  for (let attempt = 1; attempt <= 65; attempt += 1) {
    const response = await fetch(`http://localhost:3000/r/${created.code}`, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'x-forwarded-for': clientIp,
      },
    });

    attempts.push({
      attempt,
      status: response.status,
      retryAfter: response.headers.get('retry-after'),
      location: response.headers.get('location'),
    });
  }

  const summary = {
    code: created.code,
    client_ip: clientIp,
    first_attempts: attempts.slice(0, 3),
    first_rate_limited_attempt: attempts.find((attempt) => attempt.status === 429) ?? null,
    last_attempt: attempts.at(-1) ?? null,
  };

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ summary, attempts }, null, 2)}\n`,
    'utf8',
  );

  if (!summary.first_rate_limited_attempt) {
    throw new Error('Expected at least one 429 rate-limited response.');
  }
}

void main();
