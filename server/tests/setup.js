process.loadEnvFile();
process.env.NODE_ENV = 'test';

import { beforeEach, afterAll } from 'vitest';

const { prisma } = await import('../src/lib/prisma.js');

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
