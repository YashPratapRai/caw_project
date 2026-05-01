import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL.');
  }

  const prisma = new PrismaClient();
  const code = `m2-${Date.now()}`;
  const longUrl = 'https://example.com/module-02-proof';
  const createdBy = 'tenant_demo_owner';

  try {
    const inserted = await prisma.link.create({
      data: {
        code,
        longUrl,
        createdBy,
        tags: ['module-02'],
      },
    });

    const selected = await prisma.link.findUnique({
      where: { code },
    });

    if (!selected) {
      throw new Error(`Expected link for code ${code} but none was returned.`);
    }

    console.log(`inserted code: ${inserted.code}`);
    console.log(`selected code: ${selected.code}`);
    console.log(`matched long_url: ${selected.longUrl}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
