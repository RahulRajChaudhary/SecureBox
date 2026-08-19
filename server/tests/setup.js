process.loadEnvFile(new URL('../.env.test', import.meta.url));
process.env.NODE_ENV = 'test';

import { beforeEach, afterAll } from 'vitest';

if (!process.env.DATABASE_URL.endsWith('/securebox_test')) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL does not point at the test database (got ${process.env.DATABASE_URL}). ` +
      'Check server/.env.test — this guard exists because the test suite deletes all data in the database it connects to.'
  );
}

const { prisma } = await import('../src/lib/prisma.js');

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
