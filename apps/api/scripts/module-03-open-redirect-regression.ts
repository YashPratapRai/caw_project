import * as fs from 'fs';
import * as path from 'path';

const outputDir = path.resolve(process.cwd(), '..', '..', 'progress', 'evidence', 'module-03');
const outputPath = path.join(outputDir, 'fix-open-redirect-regression.json');

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const response = await fetch('http://localhost:3000/links', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      long_url: 'https://good.com@evil.example.com',
      created_by: 'tenant_alpha',
    }),
  });

  const bodyText = await response.text();
  const proof = {
    status: response.status,
    body: bodyText,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

  if (response.status !== 400) {
    throw new Error(
      `Expected credential-bearing URL to be rejected with 400, got ${response.status}.`,
    );
  }
}

void main();
