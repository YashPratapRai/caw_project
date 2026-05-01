import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seedPrefix = `breakseed-${Date.now()}`;
  const hotOwner = `${seedPrefix}-owner-hot`;

  await prisma.$executeRawUnsafe(`
    INSERT INTO links (id, code, long_url, created_at, created_by, tags)
    SELECT
      '${seedPrefix}-' || gs::text,
      '${seedPrefix}-code-' || gs::text,
      'https://example.com/' || gs::text,
      NOW() - (gs || ' seconds')::interval,
      CASE
        WHEN gs <= 18000 THEN '${hotOwner}'
        ELSE '${seedPrefix}-owner-' || (gs % 50)::text
      END,
      ARRAY['break', 'missing-index']::text[]
    FROM generate_series(1, 20000) AS gs
    ON CONFLICT (code) DO NOTHING;
  `);

  const explainRows = await prisma.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(`
    EXPLAIN ANALYZE
    SELECT id, code, long_url, created_at
    FROM links
    WHERE created_by = '${hotOwner}'
    ORDER BY created_at DESC
    LIMIT 25;
  `);

  const matchingCountResult =
    await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(`
      SELECT COUNT(*)::bigint AS count
      FROM links
      WHERE created_by = '${hotOwner}';
    `);

  const countValue = matchingCountResult[0]?.count;
  const matchingCount =
    typeof countValue === 'bigint' ? countValue.toString() : String(countValue);

  console.log(`seed_prefix: ${seedPrefix}`);
  console.log(`queried_owner: ${hotOwner}`);
  console.log(`matching_rows: ${matchingCount}`);
  console.log('explain_analyze:');
  for (const row of explainRows) {
    console.log(row['QUERY PLAN']);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
