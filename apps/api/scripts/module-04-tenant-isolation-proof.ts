import * as fs from 'fs';
import * as path from 'path';

type ProofResult = {
  status: number;
  body: string;
};

const outputDir = path.resolve(
  process.cwd(),
  '..',
  '..',
  'progress',
  'evidence',
  'module-04',
);
const outputPath = path.join(outputDir, 'tenant-isolation-proof.json');

async function requestJson(
  url: string,
  init?: RequestInit,
): Promise<ProofResult> {
  const response = await fetch(url, init);
  return {
    status: response.status,
    body: await response.text(),
  };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const baseUrl = 'http://localhost:3000';
  const userA = 'tenant-user-a';
  const userB = 'tenant-user-b';

  const create = await requestJson(`${baseUrl}/links`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userA,
    },
    body: JSON.stringify({
      long_url: 'https://example.com/tenant-a-only',
      created_by: userB,
      tags: ['tenant-a'],
    }),
  });

  if (create.status !== 201) {
    throw new Error(`Expected user A create to return 201, got ${create.status}`);
  }

  const createdLink = JSON.parse(create.body) as { id: string; created_by: string };

  const userAList = await requestJson(`${baseUrl}/links`, {
    headers: { 'x-user-id': userA },
  });
  const userBList = await requestJson(`${baseUrl}/links`, {
    headers: { 'x-user-id': userB },
  });
  const userBRead = await requestJson(`${baseUrl}/links/${createdLink.id}`, {
    headers: { 'x-user-id': userB },
  });
  const missingHeader = await requestJson(`${baseUrl}/links`, {
    headers: { 'content-type': 'application/json' },
  });

  const proof = {
    created_link_owner: createdLink.created_by,
    create,
    user_a_list: userAList,
    user_b_list: userBList,
    user_b_read_attempt: userBRead,
    missing_header: missingHeader,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

  if (createdLink.created_by !== userA) {
    throw new Error('Server did not override created_by with x-user-id.');
  }

  if (userBRead.status !== 404) {
    throw new Error(`Expected cross-tenant read to return 404, got ${userBRead.status}`);
  }

  if (missingHeader.status !== 400) {
    throw new Error(`Expected missing x-user-id to return 400, got ${missingHeader.status}`);
  }
}

void main();
